"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
export function CustomerMyndy({ agentId, accent, label, fallbackSrc }: { agentId: string; accent: string; label: string; fallbackSrc?: string }) {
  const mount = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!fallbackSrc || ready) return;
    let fallback: HTMLScriptElement | undefined;
    const timer = window.setTimeout(() => {
      if (customElements.get("myndy-convai")) { setReady(true); setFailed(false); return; }
      fallback = document.createElement("script");
      fallback.type = "module";
      fallback.src = fallbackSrc;
      fallback.onload = () => { setReady(true); setFailed(false); };
      fallback.onerror = () => setFailed(true);
      document.body.appendChild(fallback);
    }, 5000);
    return () => {
      window.clearTimeout(timer);
      if (fallback) { fallback.onload = null; fallback.onerror = null; fallback.remove(); }
    };
  }, [fallbackSrc, ready]);
  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    let widget: HTMLElement | undefined;
    void customElements.whenDefined("myndy-convai").then(() => {
      if (disposed || !mount.current) return;
      widget = document.createElement("myndy-convai");
      Object.entries({ agent_id: agentId, position: "bottom-right", bottom: "24px", right: "16px", zindex: "45", primarycolor: accent, "aria-label": label }).forEach(([key,value]) => widget!.setAttribute(key,value));
      mount.current.appendChild(widget);
    });
    return () => { disposed = true; if (widget?.parentNode) widget.parentNode.removeChild(widget); };
  }, [accent, agentId, label, ready]);
  return <><Script id="customer-myndy-script" src="https://widget.myndy.ai/myndy-convai-widget.es.js" type="module" async strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)}/><div className="fixed bottom-6 right-4 z-45" data-myndy-tenant={agentId} ref={mount}/>{failed && <p className="sr-only" role="status">The AI assistant is unavailable. Please use the Contact page.</p>}</>;
}
