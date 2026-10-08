# Domain cutover preparation — not authorized, not performed

Snapshot captured October 8, 2026; refresh immediately before any approved change. Raw public answers and timestamps are in qa/dns-before.json. DNS lookups cannot enumerate a complete zone: obtain a provider zone export, especially DKIM selectors and mail-related aliases, before any cutover.

## Verified public configuration

| Record | Current value |
| --- | --- |
| Nameservers | ns1.systemdns.com, ns2.systemdns.com, ns3.systemdns.com |
| Apex A | 35.172.94.1 |
| www CNAME | s.multiscreensite.com. |
| Apex MX | priority 10 mx.broomhome.biz.cust.b.hostedemail.com. |
| Apex SPF TXT | v=spf1 include:_spf.hostedemail.com ~all |
| Apex AAAA / CAA | No answer in public query |
| _dmarc TXT | NXDOMAIN in public query; do not create or change it as part of this task |
| DKIM and other mail aliases | Not fully inventoried; provider export needed |

MX/SPF identify Hosted Email infrastructure. The exact reseller/account ownership and mailbox access are not verified. No send/receive mailbox tests have been performed. No mail credentials were requested or accessed.

## Vercel read-only findings

Confirmed existing project `red-spectrum-website-factory`, project ID `prj_HV68RI67tT0LXTfEA1mguG6F3Ddo`, existing team `team_jaE4H8Ibm6itfUNg5ZrhI7Bi`, GitHub repository `naserwp/red-spectrum-website-factory`, production branch `main`.

Neither broomhome.biz nor www.broomhome.biz was attached to this project. A project-scoped domain configuration read returned candidate apex IPv4 `76.76.21.21` and CNAME `cname.vercel-dns.com.`. These are recorded observations, NOT final cutover instructions: after separately authorized domain attachment, obtain the exact targets shown by this existing project and recheck whether they have changed. Do not assume an apex CNAME is permitted.

## Prerequisites and proposed scope for later approval

1. Obtain business approval of this exact preview and separate production/domain authorization. Approve the outstanding administrative stages through supported workflow actions.
2. Export and preserve the full existing DNS zone, including MX, SPF, every DKIM selector, DMARC and mail aliases. Record TTLs and exact rollback values. Verify access to both the DNS provider and current mailbox.
3. Have the mailbox owner send and receive a controlled test using info@broomhome.biz. Inspect authentication results and confirm existing hosting dependencies. Record the result; no test is inferred from DNS alone.
4. Add tenant-specific production domain routing, canonical URLs, apex/www redirect behavior, indexing and sitemap only in an authorized release. Test cross-tenant routes before assigning domains. Current code does not map Broom's live domains.
5. Attach the domains only to the existing Vercel project under separate authorization. Capture its exact per-domain targets. Prepare a minimal website-only apex A/ALIAS/ANAME and www CNAME change for final approval. Preserve nameservers, registration and every mail record. Do not cancel existing hosting.

## After an authorized cutover

- Verify certificate issuance and HTTPS on apex and www; confirm exactly one canonical redirect with no loop.
- Verify all eleven page routes, images, contact links, no cross-tenant routing and intended indexing/canonical behavior.
- Repeat mailbox send and receive tests with the owner; inspect SPF/DKIM/DMARC and compare all mail records with the exported baseline.
- If website verification fails, restore only the changed website records from the pre-change export (snapshot apex A 35.172.94.1 and www CNAME s.multiscreensite.com, subject to fresh verification). Keep old hosting available. Recheck email after rollback.
- If email changes unexpectedly, stop the cutover and involve the mailbox provider; do not experiment with mail records.

No DNS, registration, nameserver, mailbox, SPF, DKIM, DMARC or MX changes were made during this implementation.
