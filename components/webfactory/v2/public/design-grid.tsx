"use client";

import Link from "next/link";
import { useState } from "react";
import { designCatalog } from "../catalog";
import { ManualPreview } from "./manual-preview";

export function DesignGrid({ filters = false }: { filters?: boolean }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All designs");
  const [availability, setAvailability] = useState("All directions");
  const items = designCatalog.filter((design) => {
    const matchesQuery = `${design.name} ${design.sector}`.toLowerCase().includes(query.toLowerCase());
    const matchesSector = sector === "All designs" || design.sector === sector;
    const matchesAvailability = availability === "All directions" || (availability === "Preview ready" ? design.ready : !design.ready);
    return matchesQuery && matchesSector && matchesAvailability;
  });
  return <>
    {filters && <div className="v2-gallery-controls"><input aria-label="Search designs" placeholder="Search by style or industry…" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Design availability" value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All directions</option><option>Preview ready</option><option>Build pending</option></select><select aria-label="Industry" value={sector} onChange={(event) => setSector(event.target.value)}>{["All designs", "Architecture", "Professional services", "Health & wellness", "Logistics", "Hospitality & retail"].map((value) => <option key={value}>{value}</option>)}</select></div>}
    {items.length ? <div className="v2-grid">{items.map((design) => <article className="v2-design" key={design.slug}><ManualPreview template={design.template} name={design.name} /><div className="v2-design-copy"><span className="v2-badge">{design.ready ? "Preview ready" : "Direction pending"}</span><h3>{design.name}</h3><small className="v2-muted">{design.sector}</small><p>{design.description}</p><Link href={`/designs/${design.slug}`} className="v2-button v2-red">Explore direction ↗</Link><Link href={`/templates/${design.template}`} className="v2-text-link">Open full example ↗</Link></div></article>)}</div> : <div className="v2-empty" role="status">No designs match. Try a different industry or search.</div>}
  </>;
}
