export type ProjectStage = 'request' | 'review' | 'brief' | 'build' | 'preview' | 'customer_review' | 'approved' | 'delivery';
export type ProjectStatusSource = {
  id: string; business: string; status: string; customer_slug: string | null;
  created_at: Date | string; updated_at: Date | string; stage: string | null;
  brief_status: string | null; build_status: string | null; review_status: string | null;
  preview_url: string | null;
};
export type ProjectStatus = {
  title: string; stage: ProjectStage; stageLabel: string; timeline: { stage: ProjectStage; label: string; complete: boolean; current: boolean }[];
  previewAvailable: boolean; previewHref: string | null; approval: 'pending' | 'in_review' | 'approved' | 'changes_requested';
  delivery: 'unavailable' | 'pending'; nextAction: string; updatedAt: string;
};
export type AdminProjectStatus = ProjectStatus & {
  id: string; customerSlug: string | null; requestStatus: string; workflowStage: string | null;
  briefStatus: string; buildStatus: string; reviewStatus: string;
};
const steps: { stage: ProjectStage; label: string }[] = [
  { stage: 'request', label: 'Request received' }, { stage: 'review', label: 'Review' },
  { stage: 'brief', label: 'Brief ready' }, { stage: 'build', label: 'Build' },
  { stage: 'preview', label: 'Preview ready' }, { stage: 'customer_review', label: 'Customer review' },
  { stage: 'approved', label: 'Approved' }, { stage: 'delivery', label: 'Delivery ready' },
];
export function mapProjectStatus(source: ProjectStatusSource): ProjectStatus {
  const review = source.review_status ?? '';
  const workflow = source.stage ?? '';
  const brief = source.brief_status === 'generated';
  const built = source.build_status === 'ready_for_review' || ['preview_ready', 'customer_approved'].includes(workflow);
  let stage: ProjectStage = 'request';
  if (source.status === 'reviewing' || source.status === 'on_hold') stage = 'review';
  if (brief) stage = 'brief';
  if (source.status === 'building' || workflow === 'build_approved' || source.build_status && !['failed', 'cancelled'].includes(source.build_status)) stage = 'build';
  if (built) stage = 'preview';
  if (workflow === 'preview_ready' || ['preview_ready', 'changes_requested', 'rebuilding'].includes(review)) stage = 'customer_review';
  if (workflow === 'customer_approved' || (source.status === 'approved' && review === 'approved')) stage = 'approved';
  const index = steps.findIndex(step => step.stage === stage);
  const previewAvailable = Boolean(source.customer_slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.customer_slug) && source.preview_url && ['preview_ready', 'customer_approved'].includes(workflow));
  // Only the approved branded host is exposed. Raw build URLs are internal.
  const previewHref = previewAvailable ? `https://preview.redspectrum.ai/${source.customer_slug}` : null;
  const approval = workflow === 'customer_approved' ? 'approved' : review === 'changes_requested' ? 'changes_requested' : workflow === 'preview_ready' ? 'in_review' : 'pending';
  const nextAction = stage === 'approved' ? 'Delivery is pending a separate handoff.' : stage === 'customer_review' ? 'Review the preview with the team; online approval is unavailable.' : source.status === 'on_hold' ? 'The team will contact you about the paused request.' : 'The team is preparing the next step.';
  return {
    title: source.business, stage, stageLabel: steps[index].label,
    timeline: steps.map((step, position) => ({ ...step, complete: position < index, current: position === index })),
    previewAvailable, previewHref, approval, delivery: 'unavailable', nextAction,
    updatedAt: new Date(source.updated_at || source.created_at).toISOString(),
  };
}
export function mapAdminProjectStatus(source: ProjectStatusSource): AdminProjectStatus {
  return { ...mapProjectStatus(source), id: source.id, customerSlug: source.customer_slug,
    requestStatus: source.status, workflowStage: source.stage,
    briefStatus: source.brief_status || 'pending', buildStatus: source.build_status || 'pending',
    reviewStatus: source.review_status || 'pending' };
}
