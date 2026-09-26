import "server-only";
import { createHmac, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { Pool } from "pg";

let pool: Pool | undefined;
export function database() {
  const connectionString = process.env.LEADS_DATABASE_URL;
  if (!connectionString) throw new Error("Storage unavailable");
  return pool ??= new Pool({ connectionString, max: 3, connectionTimeoutMillis: 4000, query_timeout: 5000 });
}
export function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function secureEqual(a: string, b: string) { return timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b))); }
export function adminConfigured() { return Boolean(process.env.WEBFACTORY_ADMIN_USER && process.env.WEBFACTORY_ADMIN_PASSWORD && (process.env.WEBFACTORY_SESSION_SECRET?.length ?? 0) >= 32 && (process.env.NODE_ENV !== "production" || process.env.WEBFACTORY_ADMIN_PASSWORD !== "change-this-before-live")); }
function signature(payload: string) { return createHmac("sha256", process.env.WEBFACTORY_SESSION_SECRET!).update(payload).digest("hex"); }
export async function isAdmin() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get("wf_admin")?.value;
  if (!token || token.length > 1024) return false;
  const [payload, mac, extra] = token.split(".");
  if (!payload || !mac || extra || !secureEqual(signature(payload), mac)) return false;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()); return data.exp > Date.now() && data.exp < Date.now() + 9 * 3600000 && data.user === process.env.WEBFACTORY_ADMIN_USER && data.version === digest(process.env.WEBFACTORY_ADMIN_PASSWORD!); } catch { return false; }
}
export async function issueSession() { const payload = Buffer.from(JSON.stringify({ user: process.env.WEBFACTORY_ADMIN_USER, exp: Date.now() + 8 * 3600000, nonce: randomBytes(16).toString("hex"), version: digest(process.env.WEBFACTORY_ADMIN_PASSWORD!) })).toString("base64url"); (await cookies()).set("wf_admin", `${payload}.${signature(payload)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 }); }
export async function sameOrigin() { const h = await headers(); const origin = h.get("origin"); try { return Boolean(origin && new URL(origin).host === h.get("host")); } catch { return false; } }
const localLimits = new Map<string, { count: number; end: number }>();
export async function rateLimit(kind: "login" | "request" | "ai" | "ai_chat", identity: string, maximum: number) {
  const slot = Math.floor(Date.now() / 900000);
  const key = digest(`${process.env.WEBFACTORY_SESSION_SECRET ?? "unconfigured"}:${kind}:${identity}:${slot}`);
  // Development login can work before storage is configured. Production uses shared PostgreSQL counters.
  if (process.env.NODE_ENV !== "production" && kind === "login") { for (const [k,v] of localLimits) if(v.end < Date.now()) localLimits.delete(k); const entry = localLimits.get(key) ?? { count: 0, end: Date.now() + 900000 }; entry.count++; localLimits.set(key,entry); return entry.count <= maximum; }
  const result = await database().query<{ count: number }>("INSERT INTO webfactory.rate_limits (key, count, expires_at) VALUES ($1,1,NOW()+INTERVAL '15 minutes') ON CONFLICT (key) DO UPDATE SET count=webfactory.rate_limits.count+1 RETURNING count", [key]);
  return result.rows[0].count <= maximum;
}
export type ProjectRequest = { id: string; name: string; business: string; email: string; phone: string; industry: string; website: string; details: string; status: string; notification_status: string; created_at: Date };
export async function listRequests(): Promise<ProjectRequest[]> { if (!await isAdmin()) throw new Error("Unauthorized"); return (await database().query<ProjectRequest>("SELECT id,name,business,email,phone,industry,website,details,status,notification_status,created_at FROM webfactory.requests ORDER BY created_at DESC LIMIT 100")).rows; }
export function notificationReady() { return process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED === "true" && Boolean(process.env.SENDGRID_API_KEY && process.env.LEADS_FROM_EMAIL && process.env.WEBFACTORY_REQUEST_NOTIFY_EMAIL); }
function escape(value: string) { return value.replace(/[&<>"']/g, x => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[x]!)); }
export async function notifyRequest(id: string) {
  if (!notificationReady()) return "disabled";
  const db = database();
  // Manual retries only; accepted sends cannot be triggered again. An interrupted send stays sending for review.
  const claimed = await db.query<ProjectRequest>("UPDATE webfactory.requests SET notification_status='sending' WHERE id=$1 AND notification_status IN ('disabled','pending','failed') RETURNING *", [id]);
  const row = claimed.rows[0]; if (!row) return "unchanged";
  const text = `New RS WebFactory request\nRequest: ${row.id}\nBusiness: ${row.business}\nContact: ${row.name}\nEmail: ${row.email}\nPhone: ${row.phone}\nIndustry: ${row.industry}\nWebsite: ${row.website}\n\n${row.details}`;
  let status = "failed";
  try { const response = await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ personalizations: [{ to: [{ email: process.env.WEBFACTORY_REQUEST_NOTIFY_EMAIL }] }], from: { email: process.env.LEADS_FROM_EMAIL, name: process.env.LEADS_FROM_NAME || "Red Spectrum WebFactory" }, reply_to: { email: row.email }, subject: "New website request — RS WebFactory", content: [{ type: "text/plain", value: text }, { type: "text/html", value: `<div style="font-family:Arial;color:#1f2937"><h1 style="color:#c92b35">RS WebFactory</h1><h2>New website request</h2><p style="white-space:pre-wrap">${escape(text)}</p></div>` }] }) }); status = response.status === 202 ? "accepted" : "failed"; } catch { status = "uncertain"; }
  await db.query("UPDATE webfactory.requests SET notification_status=$2 WHERE id=$1", [id,status]); return status;
}
