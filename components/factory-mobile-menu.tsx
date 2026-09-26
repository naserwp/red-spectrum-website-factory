"use client";

import { useRef } from "react";

const links = [
  ["#services", "Services"],
  ["/designs", "Designs"],
  ["#how-it-works", "How it works"],
  ["#myndy", "Myndy AI"],
  ["#start", "Get started"],
] as const;

export function FactoryMobileMenu() {
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={menu}
      className="rs-mobile-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>
        Menu <span aria-hidden="true">☰</span>
      </summary>
      <nav aria-label="Mobile navigation">
        {links.map(([href, label]) => (
          <a
            href={href}
            key={href}
            onClick={() => {
              if (menu.current) menu.current.open = false;
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </details>
  );
}
