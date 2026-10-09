import 'server-only';

// The authorized PR build is evidence, not a Build Engine job or admin approval.
export const mtgManualBuild = {
  requestId: '2819bf01-793b-4df0-9409-8d53c8df71ee',
  slug: 'multi-trans-global-logistics',
  commit: 'b19b897c85f26154e1145ef649d26d579b216530',
  deploymentId: 'dpl_AiwSEf4s8tBuNwWXuWSGXLhGRyfp',
  previewUrl: 'https://red-spectrum-website-factory-cn0bvbw1f-naserwps-projects.vercel.app/multi-trans-global-logistics',
  pullRequest: 'https://github.com/naserwp/red-spectrum-website-factory/pull/4',
  report: 'customers/multi-trans-global-logistics/INTEGRATION-VERIFICATION.md',
} as const;

export function getMtgManualBuild(requestId: string, slug: string | null) {
  return requestId === mtgManualBuild.requestId && slug === mtgManualBuild.slug ? mtgManualBuild : null;
}
