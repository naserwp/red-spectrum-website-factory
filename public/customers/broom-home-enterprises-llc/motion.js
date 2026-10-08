/* Progressive enhancement: content and native navigation work without this file. */
(() => {
  const start = () => {
    const site = document.querySelector('.bh');
    if (!site) return;
    const menu = site.querySelector('.bh-mobile-menu');
    const toggle = menu?.querySelector('summary');
    const close = (restoreFocus = false) => {
      if (!menu?.open) return;
      menu.open = false;
      if (restoreFocus) toggle.focus();
    };
    site.addEventListener('keydown', event => {
      if (event.key === 'Escape') close(true);
    });
    document.addEventListener('click', event => {
      if (!menu?.contains(event.target) || event.target.closest('a')) close();
    });
    site.addEventListener('focusin', event => {
      if (!menu?.contains(event.target)) close();
    });
    window.addEventListener('pageshow', () => close());

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        // Animate only on first entry; no pre-hidden content or layout changes.
        const card = entry.target.classList.contains('bh-service-card');
        const delay = card ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100 : 0;
        entry.target.animate([
          { opacity: 0.55, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 600, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        const emphasis = entry.target.querySelector('em');
        if (emphasis) emphasis.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 600, delay: 120 });
      }
    }, { threshold: 0.12 });
    site.querySelectorAll('.bh-section h2, .bh-intro-body, .bh-service-card, .bh-split > .bh-photo, .bh-values > div, .bh-contact-banner h2').forEach(element => observer.observe(element));
    preference.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      site.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
