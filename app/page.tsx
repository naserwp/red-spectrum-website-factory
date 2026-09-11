import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FactoryMobileMenu } from "@/components/factory-mobile-menu";
import { Inter, Poppins } from "next/font/google";
import {
  ArrowRight,
  ArrowUpRight,
  Monitor,
  Search,
  Sparkles,
  Check,
  MousePointer2,
} from "lucide-react";
import "./factory-landing.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--rs-inter",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--rs-poppins",
});
export const metadata: Metadata = {
  title: "Business websites, thoughtfully built — Red Spectrum",
  description:
    "Explore distinctive business website previews, search-ready foundations, and optional Myndy AI assistance. Review your website before approving launch.",
  icons: {
    icon: "/brand/red-spectrum/favicon.png",
    shortcut: "/brand/red-spectrum/favicon.png",
  },
};
const concepts = [
  {
    id: "forge",
    name: "Forge & Field",
    label: "Home & property services",
    title: "Built around the places that matter.",
    image: "photo-1600585154340-be6161a56a0c",
    alt: "Architectural home in the Forge demo design",
    note: "Bold architecture. Clear next steps.",
  },
  {
    id: "ledger",
    name: "Ledger & Line",
    label: "Professional services",
    title: "Perspective for what comes next.",
    image: "photo-1497366754035-f200968a6e72",
    alt: "Sunlit office in the Ledger demo design",
    note: "Editorial clarity. A considered approach.",
  },
  {
    id: "stillwater",
    name: "Stillwater",
    label: "Wellness & personal care",
    title: "Find your rhythm. Make it your own.",
    image: "photo-1544367567-0f2fcb009e0b",
    alt: "Yoga at sunset in the Stillwater demo design",
    note: "Organic shapes. Space to breathe.",
  },
];
function Logo() {
  return (
    <Image
      src="/brand/red-spectrum/logo-light.png"
      alt="Red Spectrum"
      width={758}
      height={199}
      className="rs-logo"
      priority
    />
  );
}
export default function Home() {
  return (
    <div className={`rs-landing ${inter.variable} ${poppins.variable}`}>
      <a className="rs-skip" href="#main">
        Skip to content
      </a>
      <header className="rs-header rs-container">
        <Link href="/" aria-label="Red Spectrum home">
          <Logo />
        </Link>
        <nav aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#templates-heading">Designs</a>
          <a href="#how-it-works">How it works</a>
          <a href="#myndy">Myndy AI</a>
        </nav>
        <a className="rs-button rs-header-action" href="#start">
          Let’s get started <ArrowRight size={17} aria-hidden="true" />
        </a>
        <FactoryMobileMenu />
      </header>
      <main id="main">
        <section className="rs-container rs-hero">
          <div>
            <p className="rs-eyebrow">Websites. Visibility. Possibility.</p>
            <h1>
              A brighter future
              <br />
              starts with a<br />
              <span>better website.</span>
            </h1>
            <p className="rs-intro">
              Your business has its own story. Let’s give it a website that
              feels like you — clear, thoughtfully designed, and ready for the
              next conversation.
            </p>
            <div className="rs-actions">
              <a href="#templates-heading" className="rs-button">
                Find your direction <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a href="#how-it-works" className="rs-button rs-outline">
                See how it works
              </a>
            </div>
            <ul className="rs-benefits">
              <li>
                <Check size={16} aria-hidden="true" />
                Distinctive design
              </li>
              <li>
                <Check size={16} aria-hidden="true" />
                Mobile-ready
              </li>
              <li>
                <Check size={16} aria-hidden="true" />
                Review before launch
              </li>
            </ul>
          </div>
          <div
            className="rs-hero-art"
            aria-label="Illustration of a business website preview"
          >
            <div className="rs-art-halo" />
            <div className="rs-art-note">
              Simple solutions.
              <br />
              Brighter business.
              <span />
            </div>
            <div className="rs-leaf rs-leaf-one" aria-hidden="true" />
            <div className="rs-leaf rs-leaf-two" aria-hidden="true" />
            <div className="rs-browser">
              <div className="rs-browser-bar">
                <i />
                <i />
                <i />
                <span>Your business, online</span>
              </div>
              <div className="rs-browser-content">
                <Image
                  src="/brand/forge/logo-light.svg"
                  width={330}
                  height={72}
                  alt="Draft Trade Co. demo logo"
                />
                <div className="rs-screen-hero">
                  <div>
                    <small>A PLACE FOR YOUR NEXT IDEA</small>
                    <strong>
                      Good spaces.
                      <br />
                      Better living.
                    </strong>
                    <span>Explore your next project ↗</span>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
                    alt="Contemporary home in an illustrative website preview"
                    fill
                    sizes="(max-width: 760px) 90vw, 40vw"
                    priority
                  />
                </div>
                <div className="rs-screen-bottom">
                  <span>
                    Your space.
                    <br />
                    <b>Your priorities.</b>
                  </span>
                  <span>
                    Built around
                    <br />
                    everyday life.
                  </span>
                </div>
              </div>
            </div>
            <div className="rs-art-badge">
              <Monitor size={22} aria-hidden="true" />
              <span>
                Made for your business.
                <br />
                <b>Not just another template.</b>
              </span>
            </div>
            <MousePointer2
              className="rs-art-cursor"
              size={33}
              aria-hidden="true"
            />
          </div>
        </section>
        <section id="services" className="rs-container rs-services rs-section">
          <div className="rs-section-top">
            <div>
              <p className="rs-eyebrow">A stronger digital foundation</p>
              <h2>Three ways to move forward.</h2>
            </div>
            <p>
              Start with a website. Build a clearer presence.
              <br />
              Make space for the work you do best.
            </p>
          </div>
          <div className="rs-service-grid">
            {[
              {
                title: "Build",
                icon: Monitor,
                text: "A business website with its own identity, useful content, and a clear path from interest to enquiry.",
                tag: "Design · Content · Responsive pages",
                tone: "teal",
              },
              {
                title: "Get Found",
                icon: Search,
                text: "Search-ready page structure, accurate business information, and metadata that helps explain what you do.",
                tag: "SEO foundations · Local information",
                tone: "red",
              },
              {
                title: "Automate",
                icon: Sparkles,
                text: "Optional enquiry workflows and Myndy AI assistance, connected only after your details and approvals are in place.",
                tag: "Lead capture · AI assistance",
                tone: "purple",
              },
            ].map(({ title, icon: Icon, text, tag, tone }) => (
              <article className={`rs-service rs-${tone}`} key={title}>
                <span className="rs-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <small>{tag}</small>
                <a
                  href={title === "Automate" ? "#myndy" : "#start"}
                  aria-label={`Explore ${title.toLowerCase()} services`}
                >
                  <ArrowUpRight size={21} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section
          className="rs-template-section"
          aria-labelledby="templates-heading"
        >
          <div className="rs-container">
            <div className="rs-section-top">
              <div>
                <p className="rs-eyebrow">
                  Different businesses. Different directions.
                </p>
                <h2 id="templates-heading">
                  A starting point.
                  <br />
                  Never the whole story.
                </h2>
              </div>
              <p>
                Explore three complete design concepts. Your layout, imagery,
                and content are adapted around your business — not copied from a
                fixed mould.
              </p>
            </div>
            <div className="rs-template-grid">
              {concepts.map((item) => (
                <article
                  className={`rs-template rs-preview-${item.id}`}
                  key={item.id}
                >
                  <Link
                    className="rs-mini-site"
                    href={`/templates/${item.id}`}
                    aria-label={`Preview ${item.name}`}
                  >
                    <div className="rs-mini-header">
                      <Image
                        src={`/brand/${item.id}/logo-light.svg`}
                        alt=""
                        width={330}
                        height={72}
                      />
                      <span>MENU ↗</span>
                    </div>
                    <div className="rs-mini-content">
                      <h3>{item.title}</h3>
                      <div className="rs-mini-photo">
                        <Image
                          src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=900&q=80`}
                          alt={item.alt}
                          fill
                          sizes="(max-width: 760px) 100vw, 33vw"
                        />
                      </div>
                    </div>
                    <span className="rs-mini-caption">{item.note}</span>
                  </Link>
                  <div className="rs-template-caption">
                    <p>{item.label}</p>
                    <Link href={`/templates/${item.id}`}>
                      <h3>{item.name}</h3>
                      <ArrowUpRight size={22} aria-hidden="true" />
                    </Link>
                    <small>
                      Illustrative demo business · No live enquiries
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="rs-container rs-process rs-section"
        >
          <div>
            <p className="rs-eyebrow">Clear steps. Room for your input.</p>
            <h2>
              From your first idea
              <br />
              to your next chapter.
            </h2>
            <p>
              You stay part of the process. We build the preview around verified
              information and make space for your feedback before launch.
            </p>
          </div>
          <ol>
            {[
              [
                "Share your business details",
                "Tell us what you do, who you serve, and what makes your business yours. Bring your logo, existing website, and any useful references.",
              ],
              [
                "Review your preview",
                "Explore every page on desktop and mobile. Check your content, look through the design, and tell us what needs refining.",
              ],
              [
                "Approve your launch",
                "Confirm the final details and approve the website. Forms and optional integrations stay off until the required checks are complete.",
              ],
            ].map(([title, text], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section id="myndy" className="rs-container rs-myndy">
          <div className="rs-chat-concept">
            <div>
              <span className="rs-ai-symbol">
                <Sparkles size={27} aria-hidden="true" />
              </span>
              <p>
                <b>Meet your next helpful touchpoint.</b>
                <small>Myndy AI · Illustrative conversation</small>
              </p>
            </div>
            <p className="rs-chat-bubble">
              Hi! What would you like to know about this business?
            </p>
            <p className="rs-chat-bubble rs-chat-user">
              I’m interested in a service. Where do I start?
            </p>
            <p className="rs-chat-bubble">
              I can explain the confirmed services and help you prepare an
              enquiry for the team.
            </p>
            <span className="rs-chat-status">
              Preview only. No chat session is connected.
            </span>
          </div>
          <div>
            <p className="rs-eyebrow">A little help, right on your website</p>
            <h2>
              A warmer welcome.
              <br />
              Even before hello.
            </h2>
            <p>
              Myndy can help visitors explore your services, answer approved
              FAQs, and collect the details your team needs for a follow-up.
            </p>
            <ul>
              <li>
                <Check size={18} aria-hidden="true" />
                Knowledge based on your confirmed information
              </li>
              <li>
                <Check size={18} aria-hidden="true" />A name and personality
                suited to your business
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                Clear handoff rules when a person needs to help
              </li>
            </ul>
            <p className="rs-small">
              Optional capability. Agent details, script, privacy review, and
              approval are required before activation.
            </p>
          </div>
        </section>
        <section className="rs-container rs-terms">
          <div>
            <p className="rs-eyebrow">A note on payment terms</p>
            <h3>Explore what works for your business.</h3>
          </div>
          <p>
            Net 30 is available to eligible customers, subject to approval and
            applicable terms. No pricing or approval is implied by this preview.
          </p>
        </section>
        <section id="start" className="rs-start">
          <div className="rs-container">
            <p className="rs-eyebrow">
              Your business deserves its own direction
            </p>
            <h2>
              Let’s make a little
              <br />
              more possible.
            </h2>
            <p>
              Ready to talk about your website? Start with your business name,
              the services you offer, and the direction you have in mind.
            </p>
            <a className="rs-button" href="https://www.theredspectrum.com/">
              Connect with Red Spectrum{" "}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <small>Continue to the official Red Spectrum website.</small>
          </div>
        </section>
      </main>
      <footer className="rs-container rs-footer">
        <div>
          <Link href="/" aria-label="Red Spectrum home">
            <Logo />
          </Link>
          <p>
            Simple solutions.
            <br />
            Brighter business.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#services">Services</a>
          <a href="#templates-heading">Explore designs</a>
          <a href="#how-it-works">How it works</a>
          <a href="#myndy">Myndy AI</a>
          <a href="https://www.theredspectrum.com/">Official website ↗</a>
        </nav>
        <div className="rs-footer-bottom">
          <p>
            © 2026 Red Spectrum. Website designed by{" "}
            <a href="https://www.theredspectrum.com/">Red Spectrum</a>.
          </p>
          <span>Website previews · Built for review</span>
        </div>
      </footer>
    </div>
  );
}
