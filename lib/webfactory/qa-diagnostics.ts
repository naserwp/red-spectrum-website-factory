// Closed vocabulary: no raw browser output, customer fields, URLs or stacks persisted.
export const qaMessages = {
  'server-start': 'The isolated production server did not become ready.',
  'customer-route': 'A required customer page did not return HTTP 200.',
  'customer-identity': 'The page business identity or canonical customer URL did not match.',
  'metadata': 'Required title or noindex preview metadata is missing.',
  'privacy': 'A private request identifier or internal configuration marker was found.',
  'browser-launch': 'The browser could not open the customer page.',
  'browser-timeout': 'The browser command exceeded its verification deadline.',
  'browser-check': 'The browser could not complete the verification command.',
  'mobile-overflow': 'Horizontal overflow detected at the recorded viewport width.',
  'images': 'One or more page images did not finish loading successfully.',
  'tenant-isolation': 'A navigation link points outside the selected customer route.',
  'page-error': 'The page displayed a runtime error.',
  'artifact-integrity': 'The saved build artifact changed or is unavailable. QA retry refused.',
} as const;
export type QaCheckName = keyof typeof qaMessages;
export type QaDiagnostic = {check_name:QaCheckName;status:'passed'|'failed';page:string;viewport:number;duration:number;timestamp:string;imageFailures?:{index:number;state:'broken'|'timeout';asset?:string}[]};
