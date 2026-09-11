// Run inside agent-browser eval --stdin after opening each route.
(async () => {
  document.querySelectorAll("img").forEach((image) => {
    image.loading = "eager";
  });
  await Promise.all(
    Array.from(document.images, (image) =>
      Promise.race([
        image.decode().catch(() => null),
        new Promise((resolve) => setTimeout(resolve, 12000)),
      ]),
    ),
  );
  document.getAnimations().forEach((animation) => animation.finish());
  const root = document.querySelector(".tp");
  const links = Array.from(root.querySelectorAll("a"), (link) =>
    link.getAttribute("href"),
  );
  const current = location.pathname.split("/")[2];
  return {
    path: location.pathname,
    viewport: innerWidth,
    overflow: document.documentElement.scrollWidth > innerWidth,
    overflowing: Array.from(root.querySelectorAll("*"))
      .filter((element) => {
        const r = element.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
      })
      .slice(0, 8)
      .map((element) => element.className),
    h1Count: root.querySelectorAll("h1").length,
    images: Array.from(document.images, (image) => ({
      alt: image.alt,
      loaded: image.complete && image.naturalWidth > 0,
    })),
    crossTemplateLinks: links.filter(
      (link) =>
        link.startsWith("/templates/") &&
        !link.startsWith("/templates/" + current),
    ),
    deadAnchors: links.filter(
      (link) => link.startsWith("#") && !document.getElementById(link.slice(1)),
    ),
    placeholderContacts: links.filter((link) => /^(tel:|mailto:)/.test(link)),
    title: document.title,
    description: !!document.querySelector('meta[name="description"]'),
    myndyDisabled:
      root
        .querySelector("[data-myndy-placeholder]")
        ?.getAttribute("data-status") === "disabled",
  };
})();
