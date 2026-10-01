import { cookies } from "next/headers";
import Link from "next/link";
import { database, digest } from "@/lib/webfactory/server";
import { WebFactoryShell, PageIntro } from "@/components/webfactory/shell";
import "@/components/webfactory/workflow.css";

export const metadata = { title: "Project Processing", robots: { index: false, follow: false } };

const statusCopy: Record<string, [string, string]> = {
  received: ["Request received", "Your details are saved. The next step is a review of your goals, content and missing information."],
  reviewing: ["Request under review", "Your brief is being reviewed. A website preview is not ready yet."],
  building: ["Build approved · preview pending", "The build has been authorized. This status does not confirm that website files have been created or checked."],
  preview_ready: ["Preview ready", "A preview has been recorded for review. Check the pages and share any changes before giving your approval."],
  approved: ["Customer approval recorded", "Your approval is recorded. Publishing remains a separate step; this does not confirm a live launch."],
  on_hold: ["Project on hold", "The project needs a manual review before moving forward."],
};

export default async function Page() {
  const token = (await cookies()).get("wf_request")?.value;
  let status: string | undefined;
  let unavailable = false;
  if (token) {
    const [id,key] = token.split(".");
    if (/^[a-f0-9-]{36}$/.test(id ?? "") && /^[a-f0-9]{64}$/.test(key ?? "")) {
      try {
        const result = await database().query<{status:string}>("SELECT status FROM webfactory.requests WHERE id=$1 AND access_hash=$2",[id,digest(key)]);
        status = result.rows[0]?.status;
      } catch { unavailable = true; }
    }
  }
  const saved = status ? statusCopy[status] : undefined;
  return <WebFactoryShell>
    <PageIntro eyebrow="Your website journey" title="Know what happens next." description="A clear path from your first request to a reviewed, approved website."/>
    <section className="wf-wrap wf-workflow">
      <article className="wf-panel wf-processing-card">
        <div><p className="wf-section-label">Project status</p><h2>{unavailable ? "Status temporarily unavailable" : saved?.[0] || "Your request, in one place."}</h2><p>{unavailable ? "We could not load your saved status. Please try again later; this does not mean your request was lost." : saved?.[1] || "Open this page in the same browser you used to submit your request. Without that private browser access, we cannot display a project status."}</p><span className="wf-badge">No automatic charges or publishing</span></div>
        <aside className="wf-processing-next"><h3>{status === "preview_ready" ? "Your next step: review" : status === "approved" ? "Your next step: launch planning" : "What you can prepare"}</h3><p>{status === "preview_ready" ? "Review every page, contact detail, image and mobile layout. Send your requested changes through your agreed Red Spectrum contact channel." : status === "approved" ? "Confirm the final content and launch requirements with Red Spectrum. Approval does not activate integrations or payments." : "Gather your logo, photos, confirmed services and correct contact details. Missing facts stay marked for review rather than being invented."}</p></aside>
      </article>
      <div className="wf-process">{[
        ["01", "Request & brief", "Your business details become a draft brief. Facts and missing information are reviewed before the build is approved."],
        ["02", "Build & verify", "Approval starts the handoff. Website files are then built separately and checked before a preview is marked ready."],
        ["03", "Review & approve", "You review the preview and request refinements. Customer approval and production launch are separate decisions."],
      ].map(([number,title,description])=><article key={number}><b>{number}</b><h3>{title}</h3><p>{description}</p></article>)}</div>
      <div className="wf-buttons"><Link className="wf-button" href="/request">Start a website request</Link><Link className="wf-button secondary" href="/designs">Explore website designs</Link><Link className="wf-button secondary" href="/checkout">Payment & manual review</Link></div>
    </section>
  </WebFactoryShell>;
}
