import { z } from "zod";
export const workerStages = ["claimed","planning","generating","applying_changes","validating","building","qa_running","preview_deploying","preview_verifying"] as const;
export const workerErrors = ["PROVIDER_UNAVAILABLE","PROVIDER_FAILED","INVALID_OUTPUT","SCOPE_REJECTED","LINT_FAILED","BUILD_FAILED","QA_FAILED","DEPLOYMENT_FAILED","PREVIEW_VERIFICATION_FAILED","WORKER_INTERRUPTED","INPUT_CHANGED","CONFIGURATION_MISSING"] as const;
export const workerInput = z.discriminatedUnion("action",[
 z.object({action:z.literal("claim"),workerId:z.string().regex(/^[a-zA-Z0-9-]{1,60}$/)}).strict(),
 z.object({action:z.enum(["heartbeat","cancel_ack"]),jobId:z.string().uuid(),lease:z.string().length(64)}).strict(),
 z.object({action:z.literal("progress"),jobId:z.string().uuid(),lease:z.string().length(64),stage:z.enum(workerStages)}).strict(),
 z.object({action:z.literal("fail"),jobId:z.string().uuid(),lease:z.string().length(64),code:z.enum(workerErrors)}).strict(),
 z.object({action:z.literal("complete"),jobId:z.string().uuid(),lease:z.string().length(64),baselineSha:z.string().regex(/^[a-f0-9]{40}$/),resultSha:z.string().regex(/^[a-f0-9]{40}$/),branch:z.string().max(150),changedFiles:z.array(z.string().max(200)).min(1).max(40),previewUrl:z.string().url().max(300),deploymentReference:z.string().regex(/^dpl_[A-Za-z0-9]+$/),qa:z.record(z.boolean()),provider:z.object({name:z.literal("openai"),model:z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/)}).strict()}).strict(),
]);
export function allowedBuildPath(slug:string,file:string){
 if(file.includes("..") || file.includes("\\") || file.startsWith("/"))return false;
 return file==="customers/manifest.json" || file===`customers/${slug}/site/customer.config.json` || file===`customers/${slug}/myndy/agent-context.md` || new RegExp(`^public/customers/${slug}/(logo|favicon|hero)\\.svg$`).test(file);
}
