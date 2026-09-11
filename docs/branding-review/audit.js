(async () => {
  await document.fonts.ready;
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
  const root = document.querySelector(".tp, .rs-landing");
  const tenant = location.pathname.split("/")[2];
  const links = Array.from(root.querySelectorAll("a"), (link) =>
    link.getAttribute("href"),
  );
  const icons = Array.from(
    document.querySelectorAll('link[rel="icon"]'),
    (icon) => icon.getAttribute("href"),
  );
  const expectedIcon = tenant
    ? "/brand/" + tenant + "/favicon.svg"
    : "/brand/red-spectrum/favicon.png";
  return {
    path: location.pathname,
    viewport: innerWidth,
    overflow: document.documentElement.scrollWidth > innerWidth,
    h1: root.querySelectorAll("h1").length,
    images: Array.from(document.images, (image) => ({
      alt: image.alt,
      loaded: image.complete && image.naturalWidth > 0,
    })),
    icons,
    correctFavicon: icons.includes(expectedIcon),
    faviconStatus: (await fetch(expectedIcon)).status,
    crossTenantLinks: tenant
      ? links.filter(
          (link) =>
            link.startsWith("/templates/") &&
            !link.startsWith("/templates/" + tenant),
        )
      : [],
    deadAnchors: links.filter(
      (link) => link.startsWith("#") && !document.getElementById(link.slice(1)),
    ),
    internalLinks: links.filter((link) =>
      /brief|delivery|customers\//.test(link),
    ),
    headerLogo: !!root.querySelector("header img"),
    footerLogo: !!root.querySelector("footer img"),
    headingFont: getComputedStyle(root.querySelector("h1")).fontFamily,
    bodyFont: getComputedStyle(root).fontFamily,
    leadRequests: performance
      .getEntriesByType("resource")
      .filter((item) => item.name.includes("/api/leads/")).length,
    activeMyndyScripts: Array.from(document.scripts).filter((script) =>
      /myndy/i.test(script.src),
    ).length,
  };
})();
