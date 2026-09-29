// Ordered, byte-budgeted partitioning of worker QA evidence.
// The control plane refuses any worker request body over 24 kB, and a complete
// five-page, six-width sweep with accessibility audits records more evidence
// than that. An oversized body is rejected before the revision can record its
// own outcome. Each batch below is validated and appended by the control plane
// on its own, so partitioning loses no check and reorders nothing.
export const bodyBudget=18000;
export function batches(diagnostics){
 const out=[];let current=[],size=0;
 for(const d of diagnostics){
  const bytes=Buffer.byteLength(JSON.stringify(d))+1;
  if(current.length&&size+bytes>bodyBudget){out.push(current);current=[];size=0;}
  current.push(d);size+=bytes;
 }
 if(current.length)out.push(current);
 return out;
}
