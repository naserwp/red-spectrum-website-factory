# L&C Real Estate Investment Group — review preview

Local URL: http://localhost:3012/lc-real-estate
Pages: Home, About, Services (with Investment Focus), Contact / Schedule a Call, Privacy.

Source: components/customers/lc-website.tsx, lc-inquiry-form.tsx, lc.css; customer registry entry in customers/manifest.json; site/customer.config.json snapshot.
Assets: public/customers/lc-real-estate/ (logo.svg, logo-light.svg, favicon.svg, hero.webp, meeting.webp, commercial.webp, office.webp).

Contact details and business positioning came exclusively from the user-provided brief dated 2026-09-28. They require owner confirmation. No unrelated LinkedIn company information was used. No location was inferred from the area code. No private offer or payment information was added to this package or website.

Integration status: inquiry form now calls the existing customer-specific lead endpoint. PostgreSQL persistence and SendGrid processing are implemented. The customer is in TEST mode; global email gates remain OFF, so normal submissions fail closed until activation approval. No real email was sent in local verification. Myndy phone/chat, payments, customer lookup, tracking signup and automatic outreach remain inactive. Telephone/email links open the visitor's own applications.

Missing/approval checklist:
- Confirm legal business name and contact ownership. The private server-side lead recipient was authorized separately; it is not included in this customer review package.
- Approve the temporary L&C logo, copy and generated illustrative imagery.
- Confirm service scope, location, operating hours and any relevant professional licensing.
- Supply owner-approved company biography and actual property media/listings if desired.
- Review privacy policy and consent with the business before launch.
- Authorize one controlled email acceptance/delivery test before live form activation. Supply/test Myndy configuration separately.
- Approve deployment separately. No public deployment is included in this local preview task.

Email draft (not sent):
Subject: Your L&C website preview is ready for review
Hi Larry, your L&C Real Estate Investment Group website preview is ready for review. It includes business information, investment inquiry sections, contact details and a temporary logo. The property images are illustrative concepts, not your listings. Form delivery and the AI phone/chat assistant are not active. Please review the name, contact details, services and brand direction before we prepare launch. No payment or credit approval is implied by this preview.

SMS draft (not sent):
Hi Larry, your L&C website preview is ready for review. Please check the branding, contact details and services. Forms and AI remain inactive pending setup and approval. — Red Spectrum
