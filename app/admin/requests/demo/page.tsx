import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/webfactory/server";
export const dynamic = "force-dynamic";
export default async function Page() { if (!await isAdmin()) redirect("/admin/login"); redirect("/admin/requests"); }
