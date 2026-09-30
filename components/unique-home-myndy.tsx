"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export function UniqueHomeMyndy({ agentId, accent }: { agentId: string; accent: string }) {
  const mount = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready || !mount.current) return;
    let disposed = false;
    let widget: HTMLElement | undefined;

    void customElements.whenDefined("myndy-convai").then(() => {
      if (disposed || !mount.current) return;
      if (mount.current.querySelector(`myndy-convai[agent_id="${agentId}"]`)) return;
      widget = document.createElement("myndy-convai");
      widget.setAttribute("agent_id", agentId);
      widget.setAttribute("position", "bottom-right");
      widget.setAttribute("bottom", "16px");
      widget.setAttribute("right", "16px");
      widget.setAttribute("zindex", "45");
      widget.setAttribute("primarycolor", accent);
      widget.setAttribute("aria-label", "Open UNIQUE HOME ENTERPRISE LLC chat assistant");
      mount.current.appendChild(widget);
    });

    return () => {
      disposed = true;
      widget?.remove();
    };
  }, [accent, agentId, ready]);

  return <>
    <Script
      id="unique-home-myndy-script"
      src="https://widget.myndy.ai/myndy-convai-widget.es.js"
      type="module"
      async
      strategy="afterInteractive"
      onReady={() => setReady(true)}
      onError={() => setFailed(true)}
    />
    <div
      ref={mount}
      data-myndy-tenant="unique-home-enterprise"
      style={{ position: "fixed", inset: "auto 16px 16px auto", zIndex: 45, maxWidth: "calc(100vw - 32px)" }}
    />
    {failed && <p className="sr-only" role="status">The chat assistant is unavailable. Please use the Contact page.</p>}
  </>;
}
