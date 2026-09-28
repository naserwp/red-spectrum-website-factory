/** Repository execution is deliberately separate from planning/chat providers. */
export const buildStatuses = ["queued","claimed","planning","generating","applying_changes","validating","building","qa_running","preview_deploying","preview_verifying","ready_for_review","changes_requested","failed","cancelled"] as const;
export type BuildStatus = typeof buildStatuses[number];
export const requiredBuildChecks = ["route_identity","required_pages","tenant_isolation","navigation","metadata","public_privacy","mobile_320_768_1440","lint","production_build"] as const;
export interface BuildArtifacts {
  changedFiles: string[];
  qa: Partial<Record<typeof requiredBuildChecks[number], boolean>>;
  previewUrl: string | null;
  deploymentReference: string | null;
}
export interface WebsiteBuildExecutor {
  readonly name: string;
  createBuild(input: { jobId: string; requestId: string; customerSlug: string; approvedBrief: unknown; instructions: string }): Promise<{ reference: string }>;
  getStatus(reference: string): Promise<{ status: BuildStatus; progressCode: string }>;
  cancelBuild(reference: string): Promise<void>;
  getArtifacts(reference: string): Promise<BuildArtifacts>;
}
// The persistent database queue is the dispatch transport. No network request is
// needed from the admin handler; a separately supervised worker leases queued jobs.
export function configuredBuildExecutor(): WebsiteBuildExecutor | null {
 if(process.env.WEBFACTORY_BUILD_EXECUTOR!=="controlled-worker-v1" || (process.env.WEBFACTORY_BUILD_WORKER_SECRET?.length ?? 0)<32)return null;
 return {
  name:"controlled-worker-v1",
  async createBuild({jobId}){return {reference:jobId};},
  async getStatus(reference){const {database}=await import("./server");const r=(await database().query("SELECT status,progress_code FROM webfactory.website_build_jobs WHERE id=$1",[reference])).rows[0];if(!r)throw Error("Job not found");return {status:r.status,progressCode:r.progress_code};},
  async cancelBuild(reference){const {database}=await import("./server");await database().query("UPDATE webfactory.website_build_jobs SET cancel_requested=true WHERE id=$1 AND finished_at IS NULL",[reference]);},
  async getArtifacts(reference){const {database}=await import("./server");const r=(await database().query("SELECT changed_files,qa_result,preview_url,deployment_reference FROM webfactory.website_build_jobs WHERE id=$1 AND status='ready_for_review'",[reference])).rows[0];if(!r)throw Error("Artifacts not verified");return {changedFiles:r.changed_files,qa:r.qa_result,previewUrl:r.preview_url,deploymentReference:r.deployment_reference};},
 };
}
