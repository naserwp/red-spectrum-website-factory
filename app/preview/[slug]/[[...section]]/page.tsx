import { getCustomerSite } from "@/lib/customers/registry";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; section?: string[] }> }) {
  const { slug, section } = await params;
  if (!getCustomerSite(slug) || (section?.length ?? 0) > 1 || !(!section?.length || ["home", "services", "about", "work", "contact"].includes(section[0]))) notFound();
  redirect(`/${slug}${section?.length && section[0] !== "home" ? `/${section[0]}` : ""}`);
}
