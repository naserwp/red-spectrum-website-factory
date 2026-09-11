import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { CustomerContactForm } from "@/components/customer-contact-form";
import {
  templateDesigns,
  type TemplateDesign,
} from "@/lib/factory/template-designs";
import type { TemplateId } from "@/lib/factory/templates";
import "./template-preview.css";

type PageName = "home" | "services" | "about" | "contact" | "privacy";
const pages = ["home", "services", "about", "contact"] as const;
const path = (id: TemplateId, page: PageName = "home") =>
  `/templates/${id}${page === "home" ? "" : `/${page}`}`;
function Photo({
  design,
  index,
  priority = false,
}: {
  design: TemplateDesign;
  index: number;
  priority?: boolean;
}) {
  const photo = design.images[index];
  return (
    <figure className="tp-photo">
      <Image
        src={`https://images.unsplash.com/${photo.id}?auto=format&fit=crop&w=1600&q=85`}
        alt={photo.alt}
        fill
        sizes="(max-width: 760px) 100vw, 60vw"
        priority={priority}
      />
    </figure>
  );
}
function Action({
  id,
  children,
  secondary = false,
}: {
  id: TemplateId;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={secondary ? "tp-text-link" : "tp-button"}
      href={path(id, secondary ? "services" : "contact")}
    >
      {children}
      <ArrowUpRight size={19} aria-hidden="true" />
    </Link>
  );
}
function Header({
  id,
  page,
  design,
}: {
  id: TemplateId;
  page: PageName;
  design: TemplateDesign;
}) {
  const links = pages.map((item) => (
    <Link
      key={item}
      href={path(id, item)}
      aria-current={page === item ? "page" : undefined}
    >
      {item[0].toUpperCase() + item.slice(1)}
    </Link>
  ));
  return (
    <>
      <a className="tp-skip" href="#template-content">
        Skip to content
      </a>
      <div className="tp-draft">
        Design concept · Illustrative business, imagery & copy · No live
        enquiries
      </div>
      <header className="tp-header tp-container">
        <Link
          className="tp-brand"
          href={path(id)}
          aria-label={`${design.name} home`}
        >
          <Image
            className="tp-business-logo"
            src={`/brand/${id}/logo-light.svg`}
            alt={design.name}
            width={330}
            height={72}
            priority
          />
        </Link>
        <nav className="tp-desktop-nav" aria-label="Main navigation">
          {links}
        </nav>
        <Link className="tp-header-cta" href={path(id, "contact")}>
          Let’s talk <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <details className="tp-mobile-nav" key={page}>
          <summary>
            Menu <span aria-hidden="true">☰</span>
          </summary>
          <nav aria-label="Mobile navigation">{links}</nav>
        </details>
      </header>
    </>
  );
}
function ServiceList({
  id,
  design,
}: {
  id: TemplateId;
  design: TemplateDesign;
}) {
  return (
    <div className="tp-service-list">
      {design.services.map((service, i) => (
        <Link
          href={`${path(id, "services")}#service-${i + 1}`}
          key={service.title}
        >
          <span className="tp-number">0{i + 1}</span>
          <div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
          <ArrowUpRight aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
function Approach({ design }: { design: TemplateDesign }) {
  return (
    <section className="tp-approach">
      <div className="tp-container">
        <div className="tp-section-heading">
          <p className="tp-kicker">A possible way forward</p>
          <h2>
            {design.initials === "DT"
              ? "From an idea to a clearer plan."
              : design.initials === "N/P"
                ? "Good decisions begin with better questions."
                : "A beginning that feels like you."}
          </h2>
          <p>
            Illustrative approach. The customer’s actual process will be
            confirmed before publication.
          </p>
        </div>
        <ol>
          {design.steps.map((step, i) => (
            <li key={step.title}>
              <span>0{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
function Home({ id, design }: { id: TemplateId; design: TemplateDesign }) {
  if (id === "forge")
    return (
      <>
        <section className="tp-forge-hero">
          <Photo design={design} index={0} priority />
          <div className="tp-container tp-hero-copy">
            <p className="tp-kicker">{design.category}</p>
            <h1>{design.headline}</h1>
            <p>{design.intro}</p>
            <Action id={id}>Let’s talk about your project</Action>
          </div>
          <div className="tp-hero-bottom">
            <span>Thoughtful improvements. Everyday spaces.</span>
            <a href="#explore">
              Explore the possibilities{" "}
              <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
        <section
          className="tp-container tp-forge-intro tp-section"
          id="explore"
        >
          <div>
            <p className="tp-kicker">A place for your next idea</p>
            <h2>It starts with how you live.</h2>
          </div>
          <div>
            <p className="tp-lead">
              A kitchen that brings everyone together. A room with a new
              purpose. A detail you have wanted to put right.
            </p>
            <p>
              Explore what matters to your project. Scope and suitability are
              confirmed through a conversation, not assumed from a photograph.
            </p>
            <Action id={id} secondary>
              Explore the services
            </Action>
          </div>
        </section>
        <section className="tp-container tp-split-services">
          <Photo design={design} index={1} />
          <div>
            <p className="tp-kicker">Where to begin · draft services</p>
            <h2>Your space. Your priorities.</h2>
            <ServiceList id={id} design={design} />
          </div>
        </section>
        <Approach design={design} />
        <section className="tp-container tp-story tp-section">
          <div>
            <p className="tp-kicker">Before the first step</p>
            <h2>A little preparation. A better conversation.</h2>
            <p>
              Bring a few photos, a list of priorities, and your questions.
              There is no need to arrive with every detail decided.
            </p>
            <Action id={id}>Start a project enquiry</Action>
          </div>
          <Photo design={design} index={2} />
        </section>
      </>
    );
  if (id === "ledger")
    return (
      <>
        <section className="tp-container tp-ledger-hero">
          <div className="tp-ledger-heading">
            <p className="tp-kicker">{design.category}</p>
            <h1>{design.headline}</h1>
            <span className="tp-editorial-note">
              Clarity begins
              <br />
              with a conversation.
            </span>
          </div>
          <div className="tp-ledger-visual">
            <Photo design={design} index={0} priority />
            <div>
              <p>{design.intro}</p>
              <Action id={id}>Open a conversation</Action>
              <span className="tp-small">
                Business advisory · Illustrative concept
              </span>
            </div>
          </div>
        </section>
        <section className="tp-container tp-ledger-services tp-section">
          <div>
            <p className="tp-kicker">The work · draft services</p>
            <h2>Different questions. A considered approach.</h2>
            <p>
              Whether you are looking at a new direction or an existing
              challenge, start with the decision in front of you.
            </p>
          </div>
          <ServiceList id={id} design={design} />
        </section>
        <section className="tp-ledger-story">
          <div className="tp-container tp-story">
            <Photo design={design} index={1} />
            <div>
              <p className="tp-kicker">Space to think</p>
              <h2>A fresh perspective starts with listening.</h2>
              <p>
                What brought you here? What have you already considered? A
                useful conversation makes room for context before moving to
                possibilities.
              </p>
              <Link className="tp-text-link" href={path(id, "about")}>
                Explore the philosophy{" "}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <Approach design={design} />
        <section className="tp-container tp-story tp-section">
          <div>
            <p className="tp-kicker">Your first conversation</p>
            <h2>No presentation needed. Just a place to start.</h2>
            <p>
              Bring the question you are working through. Keep sensitive
              financial, legal, or personal documents out of an initial enquiry.
            </p>
            <Action id={id}>Share your question</Action>
          </div>
          <Photo design={design} index={2} />
        </section>
      </>
    );
  return (
    <>
      <section className="tp-container tp-wellness-hero">
        <div>
          <p className="tp-kicker">{design.category}</p>
          <h1>{design.headline}</h1>
          <p>{design.intro}</p>
          <Action id={id}>Find your starting point</Action>
          <a className="tp-text-link" href="#pathways">
            A little inspiration <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="tp-wellness-image">
          <Photo design={design} index={0} priority />
          <span className="tp-floating-note">
            A moment for movement.
            <br />A little space to breathe.
          </span>
          <span className="tp-orbit" aria-hidden="true">
            ✳
          </span>
        </div>
      </section>
      <section className="tp-wellness-statement">
        <p className="tp-kicker">Small beginnings</p>
        <h2>
          You don’t need a new you.
          <br />
          Just some space for yourself.
        </h2>
        <p>
          Curiosity is a good place to start. Explore the kind of practice that
          interests you, then ask the questions that help you feel ready.
        </p>
      </section>
      <section
        className="tp-container tp-wellness-pathways tp-section"
        id="pathways"
      >
        <div className="tp-section-heading">
          <p className="tp-kicker">Find your way · draft services</p>
          <h2>There’s more than one way to begin.</h2>
        </div>
        <div className="tp-split-services">
          <Photo design={design} index={1} />
          <ServiceList id={id} design={design} />
        </div>
      </section>
      <section className="tp-container tp-story tp-wellness-story">
        <div>
          <p className="tp-kicker">Together, at your own pace</p>
          <h2>Make room for a different kind of energy.</h2>
          <p>
            A shared space. A familiar rhythm. The possibility of finding a
            practice you enjoy returning to. Ask about sessions and suitability
            before booking.
          </p>
          <Link className="tp-text-link" href={path(id, "about")}>
            A closer look <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <Photo design={design} index={2} />
      </section>
      <Approach design={design} />
    </>
  );
}
function InnerPage({
  id,
  page,
  design,
}: {
  id: TemplateId;
  page: Exclude<PageName, "home">;
  design: TemplateDesign;
}) {
  const title =
    page === "services"
      ? id === "forge"
        ? "A place for\nyour next project."
        : id === "ledger"
          ? "Support for the\nquestions ahead."
          : "Find a practice\nthat speaks to you."
      : page === "about"
        ? design.about
        : page === "contact"
          ? design.invitation
          : "Your information.\nHandled with clarity.";
  return (
    <>
      <section className="tp-container tp-inner-heading">
        <p className="tp-kicker">
          {page === "privacy" ? "Privacy policy · draft for review" : page}
        </p>
        <h1>{title}</h1>
        <p>
          {page === "services"
            ? "Explore these illustrative services. Availability, scope, and terms must be confirmed before any booking or engagement."
            : page === "about"
              ? "An illustrative philosophy, not a verified biography. Team details, experience, and qualifications are awaiting customer confirmation."
              : page === "contact"
                ? "Tell us what you have in mind. This is a design preview: the form does not send messages or make bookings."
                : "This preview does not submit form data. This policy is a starting point and must reflect the customer’s actual practices before launch."}
        </p>
      </section>
      {page === "services" ? (
        <>
          <div className="tp-container tp-service-details">
            {design.services.map((service, i) => (
              <section id={`service-${i + 1}`} key={service.title}>
                <Photo design={design} index={i} priority={i === 0} />
                <div>
                  <p className="tp-kicker">0{i + 1} / Draft service</p>
                  <h2>{service.title}</h2>
                  <p className="tp-lead">{service.description}</p>
                  <p>{service.detail}</p>
                  <Action id={id}>Ask about this service</Action>
                </div>
              </section>
            ))}
          </div>
          <section className="tp-container tp-faq tp-section">
            <div>
              <p className="tp-kicker">A few useful answers</p>
              <h2>Before you begin.</h2>
            </div>
            <div>
              <details>
                <summary>How do I choose a starting point?</summary>
                <p>
                  Describe your interests and the question you need help with.
                  The business must confirm which services are suitable.
                </p>
              </details>
              <details>
                <summary>Where are prices and availability?</summary>
                <p>
                  Prices, locations, and availability are unverified. Confirm
                  these directly once verified contact details are supplied.
                </p>
              </details>
              <details>
                <summary>Can I book through this preview?</summary>
                <p>
                  No. This is for design review only. No appointments, payments,
                  or enquiries are processed.
                </p>
              </details>
            </div>
          </section>
        </>
      ) : null}
      {page === "about" ? (
        <>
          <section className="tp-container tp-story tp-about-story">
            <Photo design={design} index={1} priority />
            <div>
              <p className="tp-kicker">The idea behind the concept</p>
              <h2>
                {id === "forge"
                  ? "Built around the places that matter to you."
                  : id === "ledger"
                    ? "A thoughtful exchange. A clearer starting point."
                    : "Not a finish line. A personal rhythm."}
              </h2>
              <p className="tp-lead">{design.intro}</p>
              <p>
                {id === "forge"
                  ? "Your home is more than a list of jobs. Start by considering how a change could fit into everyday life."
                  : id === "ledger"
                    ? "Every business question has a wider context. This concept places listening, clarity, and a carefully defined scope at the centre of the conversation."
                    : "Movement means different things to different people. This concept makes space for questions, preferences, and practical needs."}
              </p>
              <p className="tp-disclosure">
                Business story pending: replace this concept with a
                customer-approved introduction. Stock photographs do not depict
                the actual team, premises, or completed work.
              </p>
            </div>
          </section>
          <Approach design={design} />
        </>
      ) : null}
      {page === "contact" ? (
        <section className="tp-container tp-contact">
          <aside>
            <Photo design={design} index={2} priority />
            <div>
              <p className="tp-kicker">Before you send</p>
              <h2>A few helpful details.</h2>
              <p>
                {id === "forge"
                  ? "Tell us about the space, the work you are considering, and preferred timing."
                  : id === "ledger"
                    ? "Share a short outline of your business question and what you hope to explore."
                    : "Tell us which session interests you and practical access requirements. Please do not include medical details."}
              </p>
              <dl>
                <dt>Phone & email</dt>
                <dd>Awaiting verified customer details</dd>
                <dt>
                  {id === "forge" ? "Service area" : "Location & availability"}
                </dt>
                <dd>To be confirmed before launch</dd>
              </dl>
            </div>
          </aside>
          <div className="tp-form-panel">
            <p className="tp-kicker">Enquiry form · preview only</p>
            <h2>
              {id === "forge"
                ? "Tell us about your project"
                : id === "ledger"
                  ? "What’s on your mind?"
                  : "Let’s find a place to start"}
            </h2>
            <p className="tp-disclosure">
              Use sample details only. Delivery is disabled; a valid submission
              demonstrates the unavailable state. No verified phone or email is
              available in this concept.
            </p>
            <CustomerContactForm accent={design.accent} />
            <p className="tp-small">
              Read the{" "}
              <Link href={path(id, "privacy")}>draft privacy policy</Link>.
              Recipient verification and a successful delivery test are required
              before activation.
            </p>
          </div>
        </section>
      ) : null}
      {page === "privacy" ? (
        <article className="tp-container tp-policy">
          <aside>
            <p className="tp-kicker">Review required</p>
            <p>Draft · September 2026</p>
            <p>
              Not legal advice. Check the actual business, providers, and
              applicable obligations before publication.
            </p>
          </aside>
          <div>
            {[
              [
                "Information in an enquiry",
                "The intended form asks for name, email, phone, requested service, message, and contact consent. Do not include sensitive health, financial, or identity information. Preview submissions are disabled.",
              ],
              [
                "Purpose and delivery",
                "An activated form would be used to respond to enquiries. The business must confirm the recipient, form provider, lawful basis, and processing arrangements before enabling delivery.",
              ],
              [
                "Retention and requests",
                "The customer must supply retention periods, access procedures, and a verified privacy contact. Those details are not yet available. This draft makes no retention or deletion guarantee.",
              ],
              [
                "Hosting and future tools",
                "This concept uses stock imagery and a hosted website. No Myndy agent is activated. Review hosting logs, cookies, analytics, external requests, and future chat integrations before finalising this policy.",
              ],
              [
                "Contact and updates",
                "Business identity and privacy contact details remain unverified. Review this policy whenever actual collection or processing practices change.",
              ],
            ].map(([heading, copy]) => (
              <section key={heading}>
                <h2>{heading}</h2>
                <p>{copy}</p>
              </section>
            ))}
          </div>
        </article>
      ) : null}
    </>
  );
}
export function TemplateSite({
  template,
  page,
}: {
  template: TemplateId;
  page: PageName;
}) {
  const design = templateDesigns[template];
  return (
    <div className={`tp tp-${template}`}>
      <Header id={template} page={page} design={design} />
      <main id="template-content">
        {page === "home" ? (
          <Home id={template} design={design} />
        ) : (
          <InnerPage id={template} page={page} design={design} />
        )}
        {page !== "contact" && page !== "privacy" ? (
          <section className="tp-final-cta">
            <div className="tp-container">
              <p className="tp-kicker">The next step</p>
              <h2>{design.invitation}</h2>
              <Action id={template}>Start the conversation</Action>
            </div>
          </section>
        ) : null}
      </main>
      <footer className="tp-footer tp-container">
        <div>
          <Link className="tp-brand" href={path(template)}>
            <Image
              className="tp-business-logo"
              src={`/brand/${template}/logo-light.svg`}
              alt={design.name}
              width={330}
              height={72}
            />
          </Link>
          <p>
            Illustrative design concept. All business content is draft.
            <br />
            Stock imagery is not evidence of work, staff, or premises.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          {pages.map((item) => (
            <Link key={item} href={path(template, item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </Link>
          ))}
          <Link href={path(template, "privacy")}>Privacy policy</Link>
        </nav>
        <div className="tp-footer-bottom">
          <p>
            © 2026 {design.name}. Website designed by{" "}
            <a href="https://www.theredspectrum.com/">Red Spectrum</a>.
          </p>
          <Link href="/">
            Back to the factory <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </footer>
      <div data-myndy-placeholder="true" data-status="disabled" hidden>
        {/* Approved script and agent ID can be integrated after confirmation. */}
      </div>
    </div>
  );
}
