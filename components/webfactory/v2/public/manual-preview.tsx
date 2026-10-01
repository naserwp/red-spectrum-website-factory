"use client";

import { useEffect, useRef } from "react";

/** Same-origin example pages scroll only when the visitor scrolls the card. */
export function ManualPreview({ template, name }: { template: string; name: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const iframe = iframeRef.current;
    const track = trackRef.current;
    if (!viewport || !iframe || !track) return;
    let disposed = false;
    let animationFrame = 0;
    let content: HTMLElement | null = null;
    const measure = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        if (disposed || !content) return;
        const height = Math.ceil(content.getBoundingClientRect().height);
        const scale = viewport.clientWidth / 900;
        iframe.style.height = `${height}px`;
        iframe.style.transform = `scale(${scale})`;
        track.style.height = `${height * scale}px`;
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    const loaded = () => {
      const document = iframe.contentDocument;
      if (!document) return;
      document.documentElement.style.overflow = "hidden";
      document.querySelectorAll<HTMLElement>("a,button,input,textarea,select").forEach((element) => { element.tabIndex = -1; });
      content = document.querySelector<HTMLElement>(".v2-template");
      if (content) observer.observe(content);
      document.fonts.ready.then(() => { if (!disposed) measure(); });
      document.querySelectorAll("img").forEach((image) => image.addEventListener("load", measure, { once: true }));
      measure();
    };
    iframe.addEventListener("load", loaded);
    loaded();
    return () => { disposed = true; cancelAnimationFrame(animationFrame); observer.disconnect(); iframe.removeEventListener("load", loaded); };
  }, [template]);

  return <div ref={viewportRef} className="v2-design-visual v2-manual-preview" role="region" tabIndex={0} aria-label={`${name} manually scrollable website example`}><div ref={trackRef} aria-hidden="true"><iframe ref={iframeRef} title={`${name} website example`} src={`/templates/${template}`} width="900" height="1600" loading="lazy" tabIndex={-1} scrolling="no" /></div></div>;
}
