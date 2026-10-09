import { z } from "zod";
import { customerBuildPath } from './build-paths';
import {qaMessages,type QaCheckName} from "./qa-diagnostics";
export {qaMessages};
export const qaDiagnosticSchema=z.object({check_name:z.enum(Object.keys(qaMessages) as [QaCheckName,...QaCheckName[]]),status:z.enum(['passed','failed']),page:z.enum(['','/services','/about','/contact','/privacy','/faq']),viewport:z.union([z.literal(0),z.literal(320),z.literal(375),z.literal(430),z.literal(768),z.literal(1024),z.literal(1440),z.literal(1920)]),duration:z.number().int().min(0).max(600000),timestamp:z.string().datetime(),imageFailures:z.array(z.object({index:z.number().int().min(0).max(1000),state:z.enum(['broken','timeout']),asset:z.string().max(200).regex(/^\/customers\/[a-z0-9-]+\/[a-zA-Z0-9/_.-]+$/).optional()}).strict()).max(20).optional()}).strict();
export const commandFailureSchema=z.object({stage:z.literal('building'),category:z.enum(['install','lint','build']),exitCode:z.number().int().nullable(),summary:z.enum(['timeout','spawn_failed','output_limit','exit_nonzero','permission_denied','out_of_memory','disk_full','typescript_error','terminated'])}).strict();
export const workerStages = ["claimed","planning","generating","applying_changes","validating","building","qa_running","preview_deploying","preview_verifying"] as const;
export const workerErrors = ["PROVIDER_UNAVAILABLE","PROVIDER_FAILED","INVALID_OUTPUT","SCOPE_REJECTED","LINT_FAILED","BUILD_FAILED","QA_FAILED","DEPLOYMENT_FAILED","PREVIEW_VERIFICATION_FAILED","WORKER_INTERRUPTED","INPUT_CHANGED","CONFIGURATION_MISSING"] as const;
export const workerInput = z.discriminatedUnion("action",[
 z.object({action:z.literal("pulse"),workerId:z.string().regex(/^[a-zA-Z0-9-]{1,60}$/)}).strict(),
 z.object({action:z.literal("claim"),workerId:z.string().regex(/^[a-zA-Z0-9-]{1,60}$/),jobId:z.string().uuid().optional()}).strict(),
 z.object({action:z.enum(["heartbeat","cancel_ack"]),jobId:z.string().uuid(),lease:z.string().length(64)}).strict(),
 z.object({action:z.literal("progress"),jobId:z.string().uuid(),lease:z.string().length(64),stage:z.enum(workerStages)}).strict(),
 z.object({action:z.literal("fail"),jobId:z.string().uuid(),lease:z.string().length(64),code:z.enum(workerErrors),diagnostics:z.array(qaDiagnosticSchema).max(320).optional(),commandFailure:commandFailureSchema.optional()}).strict(),
 z.object({action:z.literal("qa_report"),jobId:z.string().uuid(),lease:z.string().length(64),diagnostics:z.array(qaDiagnosticSchema).min(1).max(320)}).strict(),
 z.object({action:z.literal('qa_checkpoint'),jobId:z.string().uuid(),lease:z.string().length(64),artifactSha:z.string().regex(/^[a-f0-9]{64}$/),baselineSha:z.string().regex(/^[a-f0-9]{40}$/),provider:z.object({name:z.literal('openai'),model:z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/)}).strict()}).strict(),
 z.object({action:z.literal("complete"),jobId:z.string().uuid(),lease:z.string().length(64),baselineSha:z.string().regex(/^[a-f0-9]{40}$/),resultSha:z.string().regex(/^[a-f0-9]{40}$/),branch:z.string().max(150),changedFiles:z.array(z.string().max(200)).min(1).max(40),previewUrl:z.string().url().max(300),deploymentReference:z.string().regex(/^dpl_[A-Za-z0-9]+$/),qa:z.record(z.boolean()),provider:z.object({name:z.literal("openai"),model:z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/)}).strict()}).strict(),
]);
export const allowedBuildPath=customerBuildPath;
