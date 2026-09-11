(() => ({
  path: location.pathname,
  ready: document.readyState,
  invalid: Array.from(document.querySelectorAll("form :invalid"), (input) => ({
    name: input.name,
    message: input.validationMessage,
  })),
  alert: document.querySelector('[role="alert"]')?.textContent ?? null,
  faqOpen: Array.from(
    document.querySelectorAll(".tp-faq details"),
    (item) => item.open,
  ),
  leadRequests: performance
    .getEntriesByType("resource")
    .filter((item) => item.name.includes("/api/leads/")).length,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  animations: document.getAnimations().length,
}))();
