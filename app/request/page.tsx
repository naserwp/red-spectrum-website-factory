import { randomUUID } from "node:crypto";
import { WebFactoryShell, PageIntro } from "@/components/webfactory/shell";
import { RequestForm } from "@/components/webfactory/forms";
export const dynamic = "force-dynamic";
export const metadata = { title: "Customer Request", robots: { index: false, follow: false } };
export default function Page() { return <WebFactoryShell><PageIntro eyebrow="Let’s build something that fits" title="Tell us about your business." description="A few details are all we need to start shaping your website. You don’t need a finished brief—just a sense of where you want to go."/><div className="wf-wrap wf-workspace"><section className="wf-panel"><RequestForm submissionId={randomUUID()}/></section><aside className="wf-panel"><h2>What happens next?</h2><ol><li>We review your business and project details.</li><li>We clarify the content and design direction.</li><li>You review your website preview before launch.</li></ol><p>Have a logo or photos? Mention them in your brief. We’ll arrange the handoff during review.</p><small>Keep passwords, payment details and sensitive personal information out of your request.</small></aside></div></WebFactoryShell>; }
