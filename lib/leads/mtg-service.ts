import 'server-only';
import { createMtgMyndyContact } from './mtg-myndy';
import { createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { mtgCommunicationConfig, mtgReady, mtgTenant, type MtgConfig } from './mtg-config';
import { mtgConsentVersion, type MtgLeadInput } from './mtg-validation';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
let pool: Pool | undefined;
export function mtgPool() { return pool ??= new Pool({ connectionString: mtgCommunicationConfig().databaseUrl, max: 3, connectionTimeoutMillis: 5000, query_timeout: 10000 }); }
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
type Delivery = { id: string; lead_id: string; kind: string; target: string; state: string; attempt_count: number };

/** Uses the existing PostgreSQL lead table, with per-recipient durable outbox sidecars. */
export class MtgLeadService {
  constructor(private readonly db: Pool, private readonly config: MtgConfig) {}

  async accept(input: MtgLeadInput, ip: string) {
    if (!mtgReady(this.config)) return { state: 'inactive' as const };
    const now = new Date();
    const bucket = hash(`${mtgTenant}\0${hash(ip + this.config.salt)}\0${Math.floor(now.getTime() / 600000)}`);
    const rate = await this.db.query(`INSERT INTO website_lead_rate_limits(bucket_key,request_count,expires_at) VALUES($1,1,$2) ON CONFLICT(bucket_key) DO UPDATE SET request_count=website_lead_rate_limits.request_count+1 RETURNING request_count`, [bucket, new Date(now.getTime() + 600000)]);
    if (Number(rate.rows[0].request_count) > 8) return { state: 'rate_limited' as const };
    const { idempotencyKey, botcheck: _botcheck, ...details } = input;
    void _botcheck;
    const payloadHash = hash(JSON.stringify(details));
    const dedupe = hash(`${mtgTenant}\0${this.config.mode}\0${Math.floor(now.getTime() / 900000)}\0${payloadHash}`);
    const client = await this.db.connect();
    let leadId = randomUUID();
    let duplicate = false;
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${mtgTenant}:${this.config.mode}:${idempotencyKey}`]);
      const prior = await client.query('SELECT lead_id,payload_hash FROM website_lead_mtg_details WHERE customer_slug=$1 AND delivery_mode=$2 AND idempotency_key=$3', [mtgTenant, this.config.mode, idempotencyKey]);
      if (prior.rows[0]) {
        if (prior.rows[0].payload_hash !== payloadHash) { await client.query('ROLLBACK'); return { state: 'conflict' as const }; }
        leadId = prior.rows[0].lead_id; duplicate = true;
      } else {
        const recipient = this.config.mode === 'test' ? this.config.testRecipient : this.config.customerRecipient;
        const message = this.summary(details);
        const inserted = await client.query(`INSERT INTO website_leads(lead_id,customer_slug,delivery_mode,dedupe_key,notification_status,recipient_email,visitor_name,visitor_email,visitor_phone,requested_service,message,received_at) VALUES($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(dedupe_key) DO NOTHING RETURNING lead_id`, [leadId, mtgTenant, this.config.mode, dedupe, recipient, input.name, input.email, input.phone, input.service, message, now]);
        if (!inserted.rowCount) {
          const existing = await client.query('SELECT lead_id FROM website_leads WHERE dedupe_key=$1 AND customer_slug=$2 AND delivery_mode=$3', [dedupe, mtgTenant, this.config.mode]);
          leadId = existing.rows[0].lead_id; duplicate = true;
        } else {
          await client.query('INSERT INTO website_lead_mtg_details(lead_id,customer_slug,delivery_mode,idempotency_key,payload_hash,request_source,details,consent_version,consent_at,sync_consent) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [leadId, mtgTenant, this.config.mode, idempotencyKey, payloadHash, input.source, details, mtgConsentVersion, now, input.syncConsent]);
          const tasks = this.config.mode === 'test' ? [['test_email', this.config.testRecipient]] : [['customer_email', this.config.customerRecipient], ['internal_email', this.config.internalRecipient]];
          for (const [kind, target] of tasks) await client.query(`INSERT INTO website_lead_mtg_deliveries(id,lead_id,customer_slug,kind,target,state) VALUES($1,$2,$3,$4,$5,'pending')`, [randomUUID(), leadId, mtgTenant, kind, target]);
          const syncState = !input.syncConsent ? 'not_requested' : this.config.myndyKey && this.config.myndyApproved ? 'pending' : 'not_configured';
          await client.query(`INSERT INTO website_lead_mtg_deliveries(id,lead_id,customer_slug,kind,target,state) VALUES($1,$2,$3,'myndy_contact',$4,$5)`, [randomUUID(), leadId, mtgTenant, mtgTenant, syncState]);
        }
      }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    // Delivery failure never erases an accepted lead or encourages a duplicate submission.
    try { await this.deliver(leadId); } catch { /* Durable tasks remain pending/sending for review. */ }
    return { state: 'saved' as const, leadId, duplicate, ...(await this.status(leadId)) };
  }

  private summary(input: Omit<MtgLeadInput, 'idempotencyKey' | 'botcheck'>) {
    return [['Source', input.source], ['Company', input.company], ['Origin', input.origin], ['Destination', input.destination], ['Freight type', input.service], ['Weight/dimensions', input.size], ['Pallets/pieces', input.pieces], ['Requested pickup', input.date], ['Instructions', input.details], ['Contact consent', mtgConsentVersion], ['Myndy contact consent', input.syncConsent ? 'yes' : 'no']].map(([label, value]) => `${label}: ${value || 'Not supplied'}`).join('\n');
  }

  async status(leadId: string) {
    const rows = await this.db.query('SELECT kind,state,readback_verified_at FROM website_lead_mtg_deliveries WHERE lead_id=$1 AND customer_slug=$2', [leadId, mtgTenant]);
    const email = rows.rows.filter(row => row.kind !== 'myndy_contact');
    return { notification: email.length && email.every(row => row.state === 'accepted') ? 'provider_accepted' : 'pending_review', myndy: rows.rows.find(row => row.kind === 'myndy_contact')?.readback_verified_at ? 'verified' : rows.rows.find(row => row.kind === 'myndy_contact')?.state || 'not_configured' };
  }

  async deliver(leadId: string) {
    if (!mtgReady(this.config)) return;
    const leadResult = await this.db.query('SELECT l.*,d.details,d.sync_consent FROM website_leads l JOIN website_lead_mtg_details d ON d.lead_id=l.lead_id WHERE l.lead_id=$1 AND l.customer_slug=$2 AND d.customer_slug=$2 AND l.delivery_mode=$3', [leadId, mtgTenant, this.config.mode]);
    const lead = leadResult.rows[0]; if (!lead) return;
    // A crashed/expired send is ambiguous. Hold it for reconciliation, never replay blindly.
    await this.db.query(`UPDATE website_lead_mtg_deliveries SET state='uncertain',error_code='send_outcome_unknown',updated_at=now() WHERE lead_id=$1 AND customer_slug=$2 AND state='sending' AND updated_at < now()-interval '5 minutes'`, [leadId, mtgTenant]);
    const tasks = await this.db.query<Delivery>('SELECT * FROM website_lead_mtg_deliveries WHERE lead_id=$1 AND customer_slug=$2 ORDER BY kind', [leadId, mtgTenant]);
    for (const task of tasks.rows) {
      const expected = task.kind === 'test_email' && this.config.mode === 'test' ? this.config.testRecipient : task.kind === 'customer_email' && this.config.mode === 'live' ? this.config.customerRecipient : task.kind === 'internal_email' && this.config.mode === 'live' ? this.config.internalRecipient : '';
      if (task.kind === 'myndy_contact') { if (!lead.sync_consent || !this.config.myndyApproved || !this.config.myndyKey) continue; }
      else if (!expected || expected !== task.target) continue;
      const claimed = await this.db.query<Delivery>(`UPDATE website_lead_mtg_deliveries SET state='sending',attempt_count=attempt_count+1,updated_at=now() WHERE id=$1 AND customer_slug=$2 AND state IN ('pending','retryable') AND attempt_count<3 AND (next_retry_at IS NULL OR next_retry_at<=now()) RETURNING *`, [task.id, mtgTenant]);
      if (!claimed.rows[0]) continue;
      let result: { state: string; receipt?: string; error?: string; verified?: boolean; retryAfter?: number };
      try {
        if (task.kind === 'myndy_contact') {
          result = await createMtgMyndyContact(this.config.myndyKey, { name: lead.visitor_name, email: lead.visitor_email, ...(lead.visitor_phone ? { phone: lead.visitor_phone } : {}), company_name: lead.details.company, notes: [`Lead ${leadId}`, this.summary(lead.details)], tags: ['website', mtgTenant, this.config.mode] });
        } else {
          const subject = `${this.config.mode === 'test' ? '[TEST] ' : ''}Multi Trans ${lead.details.source} inquiry — ${leadId}`;
          const text = `Multi Trans Global Logistics INC\nLead ID: ${leadId}\nName: ${lead.visitor_name}\nEmail: ${lead.visitor_email}\nPhone: ${lead.visitor_phone}\n${this.summary(lead.details)}\n\nThis inquiry is not a booking confirmation.`;
          const response = await fetch('https://api.sendgrid.com/v3/mail/send', { method: 'POST', headers: { Authorization: `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ personalizations: [{ to: [{ email: task.target }], subject, custom_args: { mtg_lead_id: leadId, mtg_task_id: task.id } }], from: { email: this.config.fromEmail, name: this.config.fromName }, reply_to: { email: lead.visitor_email, name: lead.visitor_name }, content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: `<div style="font-family:Arial;white-space:pre-wrap">${escape(text)}</div>` }] }), signal: AbortSignal.timeout(10000) });
          result = response.status === 202 ? { state: 'accepted', receipt: response.headers.get('x-message-id') || undefined } : { state: response.status === 429 ? 'retryable' : response.status >= 500 ? 'uncertain' : 'failed', error: `sendgrid_${response.status}` };
        }
      } catch { result = { state: 'uncertain', error: 'provider_outcome_unknown' }; }
      await this.db.query(`UPDATE website_lead_mtg_deliveries SET state=$3,provider_receipt=$4,error_code=$5,next_retry_at=CASE WHEN $3='retryable' AND attempt_count<3 THEN now()+($7 * interval '1 second') ELSE NULL END,readback_verified_at=CASE WHEN $6 THEN now() ELSE readback_verified_at END,updated_at=now() WHERE id=$1 AND customer_slug=$2 AND state='sending'`, [task.id, mtgTenant, result.state, result.receipt || null, result.error || null, result.verified === true, result.retryAfter || 120]);
    }
    const status = await this.status(leadId);
    if (status.notification === 'provider_accepted') await this.db.query(`UPDATE website_leads SET notification_status='accepted',accepted_at=COALESCE(accepted_at,now()),next_retry_at=NULL WHERE lead_id=$1 AND customer_slug=$2`, [leadId, mtgTenant]);
  }
}
