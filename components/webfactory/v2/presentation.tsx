"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Progressive enhancement: server-rendered content is visible without JavaScript. */
export function V2Presentation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const shell = main.closest(".v2-public");
    shell?.querySelectorAll<HTMLAnchorElement>("nav a").forEach((link) => {
      const href = link.getAttribute("href")?.split("#")[0];
      const active = href === "/" ? pathname === "/" : Boolean(href && (pathname === href || pathname.startsWith(`${href}/`)));
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    shell?.querySelectorAll<HTMLDetailsElement>(".v2-mobile-nav[open]").forEach((menu) => { menu.open = false; });

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !("IntersectionObserver" in window)) return;
    const targets = main.querySelectorAll<HTMLElement>(".v2-section-head, .v2-studio-pipeline > li, .v2-studio-customers > li, .v2-design, .v2-privacy-band, .wf-preview-card, .wf-panel, .v2-empty, .wf-preview-empty");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.reveal = "visible";
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    targets.forEach((target) => {
      if (target.getBoundingClientRect().top < window.innerHeight) return;
      const siblings = target.parentElement?.children;
      const index = siblings ? Array.from(siblings).indexOf(target) : 0;
      target.style.setProperty("--v2-reveal-delay", `${Math.min(index, 5) * 45}ms`);
      target.dataset.reveal = "pending";
      observer.observe(target);
    });
    const revealAll = () => targets.forEach((target) => { target.dataset.reveal = "visible"; });
    preference.addEventListener("change", revealAll);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", revealAll);
      revealAll();
    };
  }, [pathname]);

  return <main key={pathname} ref={mainRef} id="content" className="v2-page-enter">{children}</main>;
}
