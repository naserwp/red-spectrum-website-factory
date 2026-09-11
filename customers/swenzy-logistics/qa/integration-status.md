# Integration verification - final
2026-09-12

## Myndy
Exact supplied agent and module are integrated on all Swenzy routes.
Browser evidence: qa/verification.json and qa/interaction-verification.json.
- One widget per Swenzy page; client navigation preserves tenant identity.
- Leaving Swenzy for the factory removes widget and script elements.
- Browser back restores one Swenzy widget.
- Forge, Ledger and Stillwater have zero Swenzy widget/script elements.
- Mobile launcher opens and closes; visible controls remain within 390x844 viewport.
- No page runtime errors recorded.
- Reduced-motion override is present within the vendor shadow root.
- A legacy unrelated vendor avatar alt label is normalized locally to "Swenzy Logistics AI assistant"; provider agent knowledge is not altered.
The provider launcher is a div with role=button, not a native button; the test harness uses its accessible label. Early harness attempts used an incorrect native-button selector; final assertions pass.

Not tested: an actual conversation, voice/microphone session, provider knowledge accuracy or delivery/human handoff.
Manual setup still required: Miles name, avatar, greeting, knowledge, consent/retention settings and escalation destination. Do not infer that embedding configured these.

## SendGrid lead delivery
DISABLED pending the exact Accountex test inbox, authenticated sender, SendGrid Mail Send key and isolated durable PostgreSQL storage.
The deployed API correctly returns 503 while disabled; honeypot/invalid input return 400 and an unknown tenant returns 404. The protected retry endpoint rejects unauthenticated GET and POST with 401. No local-file or in-memory fallback exists.
No SendGrid API submission, email delivery or inbox receipt has been tested or claimed.
No messages were sent to Swenzy or Accountex.

## Hosting
Public Vercel preview: https://red-spectrum-website-factory.vercel.app/swenzy-logistics
Intended remote URL: https://preview.redspectrum.ai/swenzy-logistics
One Vercel project is linked and deployed. The preview subdomain is attached but awaits the SiteGround DNS record; no customer domain was changed.
