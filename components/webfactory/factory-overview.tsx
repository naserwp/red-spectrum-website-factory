import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FileCheck2, LayoutTemplate, MessageSquare, Send } from "lucide-react";
import "./factory-overview.css";
const capabilities = [
  { icon: LayoutTemplate, title: "Custom website", text: "Your brand. Your pages. Your own direction.", href: "/designs" },
  { icon: Send, title: "Lead forms", text: "A clear way for customers to get in touch.", href: "/request" },
  { icon: MessageSquare, title: "AI assistant setup", text: "Prepared around your business knowledge.", href: "/request" },
  { icon: FileCheck2, title: "Preview package", text: "Everything together, ready for your review.", href: "/processing" },
];
export function FactoryOverview() {
  return <div className="wf-overview">
    <div className="wf-overview-top"><Image src="/brand/webfactory/mark.svg" alt="" width={44} height={44}/><div><strong>RS WebFactory</strong><span>Your website, brought together.</span></div></div>
    <p className="wf-overview-label">From business brief to website preview</p>
    <div className="wf-overview-capabilities">{capabilities.map(({icon: Icon, title, text, href}) => <Link key={title} href={href} className="wf-capability"><span className="wf-capability-icon"><Icon size={23} strokeWidth={1.6}/></span><div><h2>{title}</h2><p>{text}</p></div><ArrowUpRight className="wf-capability-arrow" size={18}/></Link>)}</div>
    <div className="wf-overview-bottom"><span>01 · Brief</span><span aria-hidden>→</span><span>02 · Preview</span><span aria-hidden>→</span><span>03 · Approval</span></div>
  </div>;
}
