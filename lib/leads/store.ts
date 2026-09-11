import "server-only";

import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import type { LeadDeliveryMode } from "./config";
import type { WebsiteLeadInput } from "./validation";

const maxAttempts = 3;
const poolCache = new Map<string, Pool>();

function getPool(connectionString: string) {
  let pool = poolCache.get(connectionString);
  if (!pool) {
    pool = new Pool({ connectionString, max: 4, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
    poolCache.set(connectionString, pool);
  }
  return pool;
}

export type StoredLead = {
  leadId: string;
  customerSlug: string;
  deliveryMode: LeadDeliveryMode;
  notificationStatus: "pending" | "accepted" | "failed";
  attemptCount: number;
  recipientEmail: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  requestedService: string;
  message: string;
  receivedAt: Date;
};

function toLead(row: Record<string, unknown>): StoredLead {
  return {
    leadId: String(row.lead_id),
    customerSlug: String(row.customer_slug),
    deliveryMode: row.delivery_mode as LeadDeliveryMode,
    notificationStatus: row.notification_status as StoredLead["notificationStatus"],
    attemptCount: Number(row.attempt_count),
    recipientEmail: String(row.recipient_email),
    visitorName: String(row.visitor_name),
    visitorEmail: String(row.visitor_email),
    visitorPhone: String(row.visitor_phone),
    requestedService: String(row.requested_service),
    message: String(row.message),
    receivedAt: new Date(String(row.received_at)),
  };
}

export class LeadStore {
  private readonly pool: Pool;
  constructor(databaseUrl: string) { this.pool = getPool(databaseUrl); }

  async consumeRateLimit(bucketKey: string, expiresAt: Date, maximum: number) {
    const result = await this.pool.query<{ request_count: number }>(
      `INSERT INTO website_lead_rate_limits (bucket_key, request_count, expires_at)
       VALUES ($1, 1, $2)
       ON CONFLICT (bucket_key) DO UPDATE SET request_count = website_lead_rate_limits.request_count + 1, expires_at = EXCLUDED.expires_at
       RETURNING request_count`,
      [bucketKey, expiresAt],
    );
    return result.rows[0].request_count <= maximum;
  }

  async persist(input: {
    customerSlug: string; mode: LeadDeliveryMode; recipient: string; dedupeKey: string; receivedAt: Date; lead: WebsiteLeadInput;
  }): Promise<{ lead: StoredLead; duplicate: boolean }> {
    const inserted = await this.pool.query(
      `INSERT INTO website_leads
       (lead_id, customer_slug, delivery_mode, dedupe_key, notification_status, next_retry_at, recipient_email, visitor_name, visitor_email, visitor_phone, requested_service, message, received_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $5)
       ON CONFLICT (dedupe_key) DO NOTHING
       RETURNING *`,
      [randomUUID(), input.customerSlug, input.mode, input.dedupeKey, input.receivedAt, input.recipient, input.lead.name, input.lead.email, input.lead.phone, input.lead.service, input.lead.message],
    );
    if (inserted.rows[0]) return { lead: toLead(inserted.rows[0]), duplicate: false };
    const existing = await this.pool.query(`UPDATE website_leads SET duplicate_count = duplicate_count + 1 WHERE dedupe_key = $1 RETURNING *`, [input.dedupeKey]);
    if (!existing.rows[0]) throw new Error("Lead dedupe record disappeared.");
    return { lead: toLead(existing.rows[0]), duplicate: true };
  }

  async claim(leadId: string): Promise<StoredLead | null> {
    const result = await this.pool.query(
      `UPDATE website_leads
       SET attempt_count = attempt_count + 1, notification_status = 'pending'
       WHERE lead_id = $1 AND notification_status IN ('pending', 'failed') AND attempt_count < $2
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
       RETURNING *`,
      [leadId, maxAttempts],
    );
    return result.rows[0] ? toLead(result.rows[0]) : null;
  }

  async markAccepted(leadId: string, providerMessageId?: string) {
    await this.pool.query(`UPDATE website_leads SET notification_status = 'accepted', accepted_at = NOW(), next_retry_at = NULL, provider_message_id = $2, last_error_code = NULL WHERE lead_id = $1`, [leadId, providerMessageId ?? null]);
  }

  async markFailed(leadId: string, attemptCount: number, errorCode: string) {
    const retryAt = attemptCount < maxAttempts ? new Date(Date.now() + Math.pow(2, attemptCount) * 60_000) : null;
    await this.pool.query(`UPDATE website_leads SET notification_status = 'failed', failed_at = NOW(), next_retry_at = $2, last_error_code = $3 WHERE lead_id = $1`, [leadId, retryAt, errorCode]);
  }

  async pendingRetryIds(limit: number) {
    const result = await this.pool.query<{ lead_id: string }>(
      `SELECT lead_id FROM website_leads WHERE notification_status IN ('pending', 'failed') AND attempt_count < $1
       AND (next_retry_at IS NULL OR next_retry_at <= NOW()) ORDER BY received_at ASC LIMIT $2`,
      [maxAttempts, limit],
    );
    return result.rows.map((row) => row.lead_id);
  }
}

export type LeadStoreFactory = (databaseUrl: string) => LeadStore;
export const createLeadStore: LeadStoreFactory = (databaseUrl) => new LeadStore(databaseUrl);
