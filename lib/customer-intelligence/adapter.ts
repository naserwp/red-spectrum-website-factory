import 'server-only';
import type { CustomerIntelligenceProfile } from './types';

// Explicitly unavailable until a reviewed API contract and ownership mapping are implemented.
export async function getCustomerProfile(requestId: string): Promise<CustomerIntelligenceProfile | null> {
  void requestId;
  return null;
}
