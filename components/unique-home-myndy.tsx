"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export function UniqueHomeMyndy({ agentId }: { agentId: string }) {
  const mount = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready || !mount.current) return;
    let disposed = false;
    let widget: HTMLElement | undefined;
    void customElements.whenDefined("myndy-convai").then(() => {
      if (disposed || !mount.current || mount.current.querySelector("myndy-convai")) return;
      widget = document.createElement("myndy-convai");
      widget.setAttribute("agent_id", agentId);
      mount.current.appendChild(widget);
    }).catch(() => setFailed(true));
    return () => {
      disposed = true;
      widget?.remove();
    };
  }, [agentId, ready]);

  return <>
    <Script id="unique-home-myndy-script" src="https://widget.myndy.ai/myndy-convai-widget.es.js" type="module" async strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)} />
    <div ref={mount} data-myndy-tenant="unique-home-enterprise" className="ub-myndy" />
    {failed && <p className="sr-only" role="status">The chat assistant is unavailable. Please use the contact form.</p>}
  </>;
}
