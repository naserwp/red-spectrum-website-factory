import { mtgCommunicationConfig, mtgReady, mtgTenant } from '@/lib/leads/mtg-config';
import { mtgPool } from '@/lib/leads/mtg-service';

/** Rendered only after the existing request page has authenticated the admin. */
export async function MtgIntegrationStatus() {
  const config = mtgCommunicationConfig();
  let states: { kind: string; state: string; count: string }[] = [];
  let unavailable = false;
  try { states = (await mtgPool().query('SELECT kind,state,count(*)::text AS count FROM website_lead_mtg_deliveries WHERE customer_slug=$1 GROUP BY kind,state ORDER BY kind,state', [mtgTenant])).rows; } catch { unavailable = true; }
  return <section className="wf-panel"><h2>Multi Trans communications</h2><p>Form mode: {mtgReady(config) ? config.mode : 'inactive / configuration pending'}. Customer notification activation: {config.mode === 'live' ? 'explicitly enabled' : 'not enabled'}.</p><p>Myndy widget: dedicated agent configured with a visitor-controlled load step. Contact sync: {config.myndyKey && config.myndyApproved ? 'configured; read-back verification required' : 'dedicated credentials / approval pending'}.</p><p>Provider acceptance is not inbox delivery. This panel does not advance build, customer approval or production status.</p>{unavailable ? <p>Lead storage status unavailable; apply the additive migration and verify access.</p> : states.length ? <ul>{states.map(row => <li key={row.kind + row.state}>{row.kind}: {row.state} — {row.count}</li>)}</ul> : <p>No Multi Trans delivery records yet.</p>}</section>;
}
