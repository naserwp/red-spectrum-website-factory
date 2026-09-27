import "server-only";
import studioReceipt from "@/customers/jm0616studio/site/build-receipt.json";
import { getCustomerSite } from "@/lib/customers/registry";

// Read-only local build evidence. Never infer a request/tenant association by name.
export function getLocalBuildReceipt(requestId: string) {
  return requestId === studioReceipt.requestId && getCustomerSite(studioReceipt.customerSlug)
    ? studioReceipt : null;
}
