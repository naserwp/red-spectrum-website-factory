"use server";
import { randomBytes, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminConfigured, database, digest, isAdmin, issueSession, notifyRequest, rateLimit, sameOrigin, secureEqual } from "@/lib/webfactory/server";
export type FormState = { error?: string; success?: string };
const requestSchema = z.object({ name: z.string().trim().min(2).max(100), business: z.string().trim().min(2).max(160), email: z.string().trim().email().max(254), phone: z.string().trim().max(40), industry: z.string().trim().min(2).max(120), website: z.string().trim().max(500), details: z.string().trim().min(20).max(6000), consent: z.literal("on"), submissionId: z.string().uuid() });
export async function submitRequest(_: FormState, data: FormData): Promise<FormState> {
  if (!await sameOrigin()) return { error: "Please reload this page and try again." };
  if (data.get("companyFax")) return { error: "Unable to submit this request." };
  const result = requestSchema.safeParse(Object.fromEntries(data));
  if (!result.success) return { error: "Check the required fields, email address and consent. Please include at least 20 characters about your project." };
  const input = result.data; const id = randomUUID(); const access = randomBytes(32).toString("hex");
  try {
    const h = await headers();
    if (!await rateLimit("request", h.get("x-forwarded-for")?.split(",")[0] || "local", 10)) return { error: "Too many requests. Please try again in 15 minutes." };
    const stored = await database().query("INSERT INTO webfactory.requests (id,submission_id,access_hash,name,business,email,phone,industry,website,details) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (submission_id) DO NOTHING RETURNING id", [id,input.submissionId,digest(access),input.name,input.business,input.email,input.phone,input.industry,input.website,input.details]);
    if (!stored.rowCount) return { success: "This request was already received. Open Project Processing in the same browser to see your saved request." };
    (await cookies()).set("wf_request", `${id}.${access}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 86400, path: "/" });
    // Internal mail requires a separately confirmed sender, recipient and explicit enabling flag.
    await notifyRequest(id).catch(() => undefined);
  } catch { return { error: "Request storage is temporarily unavailable. Your request has not been confirmed. Your entries remain here; please try again later." }; }
  redirect("/processing");
}
export async function login(_: FormState, data: FormData): Promise<FormState> {
  if (!await sameOrigin() || !adminConfigured()) return { error: "Admin access is not configured for this environment." };
  const user = String(data.get("username") ?? ""); const password = String(data.get("password") ?? "");
  if (user.length > 100 || password.length > 256) return { error: "Invalid login details." };
  try { if (!await rateLimit("login", "admin", 10)) return { error: "Too many login attempts. Try again in 15 minutes." }; } catch { return { error: "Secure login is temporarily unavailable. Please check the admin storage setup." }; }
  const validUser = secureEqual(user, process.env.WEBFACTORY_ADMIN_USER!); const validPassword = secureEqual(password, process.env.WEBFACTORY_ADMIN_PASSWORD!);
  if (!validUser || !validPassword) return { error: "Invalid login details." };
  await issueSession(); redirect("/admin");
}
export async function logout() { if (!await sameOrigin()) return; (await cookies()).delete("wf_admin"); redirect("/admin/login"); }
export async function updateRequest(_: FormState, data: FormData): Promise<FormState> {
  if (!await sameOrigin() || !await isAdmin()) return { error: "Please sign in again." };
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["received","reviewing","building","preview_ready","approved","on_hold"]) }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: "Invalid request status." };
  if (["building","preview_ready","approved"].includes(parsed.data.status)) return { error: "Use the request build workspace approval gates." };
  try { const result = await database().query("UPDATE webfactory.requests SET status=$2,updated_at=NOW() WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM webfactory.build_workflows WHERE request_id=$1) RETURNING id",[parsed.data.id,parsed.data.status]); if (!result.rowCount) return { error: "Request not found." }; } catch { return { error: "Could not save the status. Please try again." }; }
  revalidatePath("/admin"); revalidatePath("/processing"); return { success: "Project status updated." };
}
export async function sendInternalNotification(_: FormState, data: FormData): Promise<FormState> {
  if (!await sameOrigin() || !await isAdmin()) return { error: "Please sign in again." };
  const id = z.string().uuid().safeParse(data.get("id")); if (!id.success) return { error: "Invalid request." };
  try { const status = await notifyRequest(id.data); return { success: status === "accepted" ? "SendGrid accepted the internal notification. Inbox delivery is not confirmed." : `Internal notification status: ${status}.` }; } catch { return { error: "Notification could not be processed." }; }
}
