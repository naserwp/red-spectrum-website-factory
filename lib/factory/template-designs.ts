import type { TemplateId } from "./templates";
export const templateDesigns = {
  forge: {
    name: "Draft Trade Co.",
    initials: "DT",
    category: "Spaces with purpose",
    accent: "#a43c20",
    headline: "Good spaces.\nBetter everyday living.",
    intro:
      "A new idea for your home starts with a conversation about how you want to live in it.",
    invitation: "What would you change about your space?",
    about: "Behind every project is a place that matters.",
    images: [
      {
        id: "photo-1600585154340-be6161a56a0c",
        alt: "Contemporary home with an open terrace",
      },
      {
        id: "photo-1600210492486-724fe5c67fb0",
        alt: "Light-filled living room with natural materials",
      },
      {
        id: "photo-1503387762-592deb58ef4e",
        alt: "Architectural drawings and planning materials",
      },
    ],
    services: [
      {
        title: "Spaces to make your own",
        description: "Explore improvements around the way you use your home.",
        detail:
          "Tell us which part of the property is involved and what you would like to feel different.",
      },
      {
        title: "Care for what is already there",
        description: "Start a conversation about repairs and maintenance.",
        detail:
          "A description and photographs can frame an initial discussion. Scope and availability need confirmation.",
      },
      {
        title: "A plan before a project",
        description: "Bring your questions to an initial project discussion.",
        detail:
          "Share priorities, access considerations, and preferred timing. Assessment arrangements and fees must be agreed before booking.",
      },
    ],
    steps: [
      {
        title: "Describe the space",
        description: "What works, what does not, and what you hope to change.",
      },
      {
        title: "Discuss the possibilities",
        description:
          "Clarify scope, materials, access, and questions still to answer.",
      },
      {
        title: "Agree the next step",
        description: "Review a confirmed scope and quote before committing.",
      },
    ],
  },
  ledger: {
    name: "North & Pine Advisory",
    initials: "N/P",
    category: "A considered perspective",
    accent: "#304b3e",
    headline: "Perspective for\nwhat comes next.",
    intro:
      "Make room to think clearly about your business, your priorities, and the decisions ahead.",
    invitation: "Bring your next big question.",
    about: "Start with the question.\nNot the assumption.",
    images: [
      {
        id: "photo-1497366754035-f200968a6e72",
        alt: "Sunlit office corridor with glass meeting-room walls",
      },
      {
        id: "photo-1521737711867-e3b97375f902",
        alt: "People exchanging ideas around a meeting table",
      },
      {
        id: "photo-1450101499163-c8848c66ca85",
        alt: "Documents and notes being reviewed at a desk",
      },
    ],
    services: [
      {
        title: "Direction & priorities",
        description:
          "Turn a broad business question into a focused discussion.",
        detail:
          "Bring the context behind a decision: what has changed, which constraints matter, and where you need another perspective.",
      },
      {
        title: "Planning & analysis",
        description: "Look at the information behind your next move.",
        detail:
          "Explore assumptions, information gaps, and options. Deliverables and professional scope must be confirmed.",
      },
      {
        title: "An ongoing conversation",
        description: "Consider what continued guidance could look like.",
        detail:
          "Discuss the support you need and a suitable cadence. No engagement is implied by an enquiry.",
      },
    ],
    steps: [
      {
        title: "Context first",
        description:
          "Begin with your situation, rather than a predetermined solution.",
      },
      {
        title: "Questions that matter",
        description: "Separate immediate decisions from longer-term ambitions.",
      },
      {
        title: "A defined scope",
        description:
          "Agree the work, responsibilities, and terms before an engagement.",
      },
    ],
  },
  stillwater: {
    name: "Quiet Current Wellness",
    initials: "qc",
    category: "Make a little room for you",
    accent: "#285b50",
    headline: "Find your rhythm.\nMake it your own.",
    intro:
      "Explore space for movement, a moment to pause, and a practice that fits into your everyday life.",
    invitation: "Your next chapter can start gently.",
    about: "More room to move.\nMore space to be.",
    images: [
      {
        id: "photo-1544367567-0f2fcb009e0b",
        alt: "Person stretching into a yoga pose against a sunset sky",
      },
      {
        id: "photo-1506126613408-eca07ce68773",
        alt: "Person practising a seated yoga pose outdoors",
      },
      {
        id: "photo-1518611012118-696072aa579a",
        alt: "People taking part in a group movement session",
      },
    ],
    services: [
      {
        title: "A practice of your own",
        description: "Explore individual sessions around your interests.",
        detail:
          "Share your interests and access needs. Suitability, qualifications, and availability need confirmation.",
      },
      {
        title: "Room to grow",
        description: "Discover what a guided programme could look like.",
        detail:
          "Ask about format, level, and time commitment. No health outcome is promised.",
      },
      {
        title: "Move alongside others",
        description: "Consider the energy of a small-group setting.",
        detail:
          "Ask about group size, accessibility, and what to bring. Classes, schedules, and prices are not confirmed in this preview.",
      },
    ],
    steps: [
      {
        title: "Come with curiosity",
        description:
          "You do not need everything figured out to ask a question.",
      },
      {
        title: "Find a starting point",
        description:
          "Talk through your interests and practical considerations.",
      },
      {
        title: "Choose your pace",
        description: "Confirm suitability and session details before booking.",
      },
    ],
  },
} satisfies Record<
  TemplateId,
  {
    name: string;
    initials: string;
    category: string;
    accent: string;
    headline: string;
    intro: string;
    invitation: string;
    about: string;
    images: { id: string; alt: string }[];
    services: { title: string; description: string; detail: string }[];
    steps: { title: string; description: string }[];
  }
>;
export type TemplateDesign = (typeof templateDesigns)[TemplateId];
