"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

const subscribe = () => () => {};
/** Keep the provider widget mounted while protecting navigation, forms and privacy links. */
export function MtgAssistant({ children }: { children: ReactNode }) {
  const shell = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    const container = shell.current;
    if (!container) return;
    let root: ShadowRoot | undefined;
    let imageObserver: MutationObserver | undefined;
    let mobileStyle: HTMLStyleElement | undefined;
    let widgetHost: Element | undefined;
    const updateSafeTop = () => {
      const header = document.querySelector('.mtg-header');
      if (widgetHost instanceof HTMLElement) {
        widgetHost.style.setProperty('--mtg-chat-safe-top', Math.max(8, (header?.getBoundingClientRect().bottom ?? 0) + 8) + 'px');
      }
    };
    const headerObserver = new ResizeObserver(updateSafeTop);
    const header = document.querySelector('.mtg-header');
    if (header) headerObserver.observe(header);
    window.addEventListener('resize', updateSafeTop);
    window.addEventListener('scroll', updateSafeTop, { passive: true });
    const imageTimers = new Set<number>();
    const pendingImages = new WeakSet<HTMLImageElement>();
    const fallback = (image: HTMLImageElement) => {
      if (!image.matches('.fab-logo-circle img') || image.dataset.mtgFallback) return;
      image.dataset.mtgFallback = 'true';
      image.alt = 'Multi Trans Freight Assistant';
      image.src = '/customers/multi-trans-global-logistics/chat.svg';
    };
    const onError = (event: Event) => { if (event.target instanceof HTMLImageElement) fallback(event.target); };
    const scanImages = () => root?.querySelectorAll<HTMLImageElement>('.fab-logo-circle img').forEach(image => {
      if (image.complete && !image.naturalWidth) fallback(image);
      else if (!image.naturalWidth && !pendingImages.has(image)) {
        pendingImages.add(image);
        const timer = window.setTimeout(() => {
          imageTimers.delete(timer);
          if (!image.naturalWidth) fallback(image);
        }, 2000);
        imageTimers.add(timer);
      }
    });
    const attach = () => {
      const widget = container.querySelector('myndy-convai');
      if (root || widget?.getAttribute('agent_id') !== 'agent_1791499171_dFkdItb29IQasjpC9SdkgA' || !widget.shadowRoot) return;
      root = widget.shadowRoot;
      widgetHost = widget;
      updateSafeTop();
      // Provider styles live in a shadow root; scope these overrides to this tenant.
      mobileStyle = document.createElement('style');
      mobileStyle.textContent = `
        @media (max-width: 360px) {
          .lead-form-buttons { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px !important; }
          .lead-form-button { min-width: 0; padding: 14px 8px !important; gap: 6px !important; }
          .lead-form-button svg { flex-shrink: 0; }
        }
        @media (max-width: 1000px) {
          .widget-main-container { max-height: calc(100dvh - var(--mtg-chat-safe-top, 120px) - 8px); bottom: 8px !important; }
          .widget-container { min-height: 0 !important; max-height: 100% !important; flex: 1 1 auto; overflow-y: auto !important; bottom: auto !important; }
          .close-fab, .back-button, .powered-by-bot { flex-shrink: 0; }
        }
      `;
      root.appendChild(mobileStyle);
      root.addEventListener('error', onError, true);
      imageObserver = new MutationObserver(scanImages);
      imageObserver.observe(root, { childList: true, subtree: true });
      scanImages();
    };
    const mountObserver = new MutationObserver(attach);
    mountObserver.observe(container, { childList: true, subtree: true });
    attach();
    return () => {
      mobileStyle?.remove();
      headerObserver.disconnect();
      window.removeEventListener('resize', updateSafeTop);
      window.removeEventListener('scroll', updateSafeTop);
      imageTimers.forEach(timer => window.clearTimeout(timer));
      mountObserver.disconnect();
      imageObserver?.disconnect();
      root?.removeEventListener('error', onError, true);
    };
  }, []);
  return <div ref={shell} data-mtg-ready={mounted} className="mtg-widget-shell" style={{ visibility: obstructsControls ? 'hidden' : undefined }}>{children}</div>;
}
