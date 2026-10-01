export const designCatalog = [
  { slug: "forge-&-field", template: "forge", name: "Forge & Field", sector: "Architecture", description: "Editorial layouts for spaces worth discovering.", image: 1, ready: true },
  { slug: "ledger-&-line", template: "ledger", name: "Ledger & Line", sector: "Professional services", description: "A confident presence built around expertise.", image: 2, ready: true },
  { slug: "stillwater-studio", template: "stillwater", name: "Stillwater Studio", sector: "Health & wellness", description: "Calm, considered design with room to breathe.", image: 3, ready: true },
  { slug: "beacon-logistics", template: "beacon", name: "Beacon Logistics", sector: "Logistics", description: "Clear service pages that keep business moving.", image: 4, ready: true },
  { slug: "meridian-artisan-bakehouse", template: "meridian", name: "Meridian Artisan Bakehouse", sector: "Hospitality & retail", description: "A welcoming showcase of craft and community.", image: 5, ready: false },
  { slug: "ironwood-custom-homes", template: "ironwood", name: "Ironwood Custom Homes", sector: "Architecture", description: "A considered foundation for your next home.", image: 6, ready: false },
] as const;

export type Design = (typeof designCatalog)[number];

export function getDesign(slug: string): Design | undefined {
  let normalized = slug;
  try { normalized = decodeURIComponent(slug); } catch { return undefined; }
  return designCatalog.find((design) => design.slug === normalized);
}
