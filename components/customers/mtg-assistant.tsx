"use client";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';

const subscribe = () => () => {};
/** Keep the provider widget mounted while protecting navigation, forms and privacy links. */
export function MtgAssistant({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [obstructsControls, setObstructsControls] = useState(false);
  useEffect(() => {
    const targets = [...document.querySelectorAll('[data-mtg-lead], .mtg-footer-bottom')];
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      }
      setObstructsControls(visible.size > 0);
    });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  return <div data-mtg-ready={mounted} className="mtg-widget-shell" style={{ visibility: obstructsControls ? 'hidden' : undefined }}>{children}</div>;
}
