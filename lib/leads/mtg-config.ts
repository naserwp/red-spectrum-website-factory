import 'server-only';
import { z } from 'zod';

export const mtgTenant = 'multi-trans-global-logistics';
export const mtgRequestId = '2819bf01-793b-4df0-9409-8d53c8df71ee';
export const mtgAgentId = 'agent_1791499171_dFkdItb29IQasjpC9SdkgA';
const email = z.string().email().max(200);
export function mtgCommunicationConfig() {
  const requested = process.env.WEBFACTORY_MTG_LEADS_MODE;
  const liveApproved = process.env.WEBFACTORY_MTG_LIVE_APPROVED === 'true' && process.env.WEBFACTORY_MTG_RECIPIENT_VERIFIED === 'true';
  const mode = requested === 'test' ? 'test' : requested === 'live' && liveApproved ? 'live' : 'disabled';
  const testRecipient = email.safeParse(process.env.LEADS_TEST_TO_EMAIL?.trim());
  const internalRecipient = email.safeParse(process.env.WEBFACTORY_REQUEST_NOTIFY_EMAIL?.trim());
  const from = email.safeParse(process.env.LEADS_FROM_EMAIL?.trim());
  return {
    mode,
    databaseUrl: process.env.LEADS_DATABASE_URL?.trim() || '',
    salt: process.env.LEADS_RATE_LIMIT_SALT?.trim() || '',
    apiKey: process.env.SENDGRID_API_KEY?.trim() || '',
    fromEmail: from.success ? from.data : '',
    fromName: 'Red Spectrum WebFactory',
    testRecipient: testRecipient.success ? testRecipient.data : '',
    internalRecipient: internalRecipient.success ? internalRecipient.data : '',
    customerRecipient: 'mtglobal39@gmail.com',
    myndyKey: process.env.MYNDY_API_KEY_MULTI_TRANS?.trim() || '',
    myndyApproved: process.env.MYNDY_MULTI_TRANS_OWNER_VERIFIED === 'true' && process.env.MYNDY_MULTI_TRANS_SYNC_APPROVED === 'true',
  } as const;
}
export type MtgConfig = ReturnType<typeof mtgCommunicationConfig>;
export function mtgReady(config: MtgConfig) {
  return config.mode !== 'disabled' && Boolean(config.databaseUrl && config.salt && config.apiKey && config.fromEmail && (config.mode === 'test' ? config.testRecipient : config.internalRecipient));
}
