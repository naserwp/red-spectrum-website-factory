import { notFound } from "next/navigation";
import { SampleProject } from "@/components/webfactory/v2/client/project";
export const metadata = { title: "Sample delivery", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { if ((await params).id !== "sample-project") notFound(); return <SampleProject delivery />; }
