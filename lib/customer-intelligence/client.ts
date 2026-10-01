import 'server-only';
import type { CustomerIntelligenceAvailability } from './types';

// Configuration is read only on the server. No requests are made until an approved contract exists.
export function customerIntelligenceAvailability(): CustomerIntelligenceAvailability {
  const base = process.env.CUSTOMER_INTELLIGENCE_BASE_URL;
  const key = process.env.CUSTOMER_INTELLIGENCE_API_KEY;
  if (!base || !key) return 'unconfigured';
  try { return new URL(base).protocol === 'https:' ? 'configured' : 'unconfigured'; }
  catch { return 'unconfigured'; }
}
