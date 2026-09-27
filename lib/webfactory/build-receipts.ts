import "server-only";
import studioReceipt from "@/customers/jm0616studio/site/build-receipt.json";
import lcReceipt from "@/customers/lc-real-estate/site/build-receipt.json";
import { getCustomerSite } from "@/lib/customers/registry";

// Read-only local build evidence. Never infer a request/tenant association by name.
export function getLocalBuildReceipt(requestId: string) {
  return [studioReceipt,lcReceipt].find(receipt=>receipt.requestId===requestId && getCustomerSite(receipt.customerSlug)) ?? null;
}
