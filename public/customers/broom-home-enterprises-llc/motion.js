/* Progressive enhancement: content and native navigation work without this file. */
(() => {
  const start = () => {
    const site = document.querySelector('.bh');
    if (!site) return;
    // Broom's verified agent only. This also works on the branded, server-rendered
    // preview, where Next hydration is intentionally removed.
    const chat = site.querySelector('[data-broom-agent]');
    const broomAgent = 'agent_1791578673_rmH9kMoBMuSgTK0WoVmujw';
    if (site.dataset.customerSlug === 'broom-home-enterprises-llc' && chat?.dataset.broomAgent === broomAgent && !chat.dataset.started) {
      chat.dataset.started = 'true';
      const status = chat.querySelector('[data-broom-chat-status]');
      const fail = () => {
        status.hidden = false;
        status.firstChild.textContent = 'Broom Home Guide is unavailable. ';
      };
      const timeout = setTimeout(fail, 20000);
      const mount = () => {
        customElements.whenDefined('myndy-convai').then(() => {
          clearTimeout(timeout);
          if (chat.querySelector('myndy-convai')) return;
          const widget = document.createElement('myndy-convai');
          Object.entries({ agent_id: broomAgent, position: 'bottom-right', bottom: '24px', right: '16px', zindex: '45', primarycolor: '#132238', 'aria-label': 'Broom Home Guide AI chat' }).forEach(([key, value]) => widget.setAttribute(key, value));
          chat.appendChild(widget);
          status.hidden = true;
        });
      };
      if (customElements.get('myndy-convai')) mount();
      else {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://widget.myndy.ai/myndy-convai-widget.es.js';
        script.onload = mount;
        script.onerror = () => { clearTimeout(timeout); fail(); };
        document.head.appendChild(script);
      }
    }
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
    // Only reset restored history entries. A late initial image load must not
    // close a menu that a visitor has already opened.
    window.addEventListener('pageshow', event => { if (event.persisted) close(); });

    const form = site.querySelector('[data-broom-contact]');
    const status = site.querySelector('#bh-form-status');
    if (form && status) {
      let busy = false;
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy || !form.reportValidity()) return;
        busy = true;
        const button = form.querySelector('button[type="submit"]');
        const payload = new FormData(form);
        button.disabled = true;
        button.textContent = 'Sending your inquiry…';
        form.setAttribute('aria-busy', 'true');
        status.textContent = 'Sending securely. Please wait.';
        status.classList.remove('bh-form-error');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await fetch(form.action, { method: 'POST', body: payload, headers: { Accept: 'application/json' }, signal: controller.signal });
          const result = await response.json();
          status.textContent = result.message || 'We could not confirm receipt. Please call or email the team.';
          if (response.ok && result.ok) {
            form.reset();
            form.querySelector('fieldset').disabled = true;
            button.textContent = 'Inquiry received';
          } else if (result.saved) {
            button.textContent = 'Inquiry saved — notification pending';
            status.classList.add('bh-form-error');
          } else {
            busy = false;
            button.disabled = false;
            button.textContent = 'Send inquiry ↗';
            status.classList.add('bh-form-error');
          }
        } catch {
          // An interrupted connection can still leave a saved inquiry. Never
          // automatically retry or encourage an ambiguous duplicate submission.
          status.textContent = 'We could not confirm receipt. Please call or email before sending again.';
          status.classList.add('bh-form-error');
          button.textContent = 'Please contact the team';
        } finally {
          clearTimeout(timeout);
          form.removeAttribute('aria-busy');
          status.focus();
        }
      });
    }

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
