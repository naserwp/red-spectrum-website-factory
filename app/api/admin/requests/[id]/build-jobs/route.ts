import { z } from "zod";
import { isAdmin, sameOrigin, rateLimit } from "@/lib/webfactory/server";
import { chatSession } from "@/lib/webfactory/chat-store";
import { BuildJobError, createBuildJob, listBuildJobs, cancelBuildJob, retryBuildQa, restartBuildJob, recoverBuildArtifact } from "@/lib/webfactory/build-jobs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const input=z.discriminatedUnion("action",[
  z.object({action:z.literal("recover_artifact"),confirmed:z.literal(true),jobId:z.string().uuid(),artifactAttempt:z.number().int().min(0).max(3),checkpoint:z.object({artifactSha:z.string().regex(/^[a-f0-9]{64}$/),baselineSha:z.string().regex(/^[a-f0-9]{40}$/),provider:z.object({name:z.literal("openai"),model:z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/)}).strict()}).strict()}).strict(),
  z.object({action:z.literal("restart"),confirmed:z.literal(true),jobId:z.string().uuid()}).strict(),
  z.object({action:z.literal("create"),confirmed:z.literal(true),submissionId:z.string().uuid(),requestedChanges:z.string().max(6000).default("")}).strict(),
  z.object({action:z.literal("cancel"),confirmed:z.literal(true),jobId:z.string().uuid()}).strict(),
  z.object({action:z.literal("retry_qa"),confirmed:z.literal(true),jobId:z.string().uuid()}).strict(),
]);
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await isAdmin())return json({error:"Please sign in."},401);
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return json({error:"Invalid request."},400);
  try{return json(await listBuildJobs(id));}catch{return json({error:"Build history unavailable. Check storage and migration."},503);}
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await isAdmin())return json({error:"Please sign in."},401);
  if(!await sameOrigin())return json({error:"Invalid origin."},403);
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return json({error:"Invalid request."},400);
  try{
    const raw=await request.text();
    if(raw.length>8000)return json({error:"Request too large."},400);
    const parsed=input.safeParse(JSON.parse(raw));
    if(!parsed.success)return json({error:"Confirm the build action and change scope."},400);
    const actor="session:"+(await chatSession())!.slice(0,12),data=parsed.data;
    if(data.action==="create"){
      if(!await rateLimit("ai","build-job:"+id,12))return json({error:"Build request limit reached. Retry later."},429);
      await createBuildJob(id,data.submissionId,actor,data.requestedChanges);
    }
    else if(data.action==='recover_artifact')await recoverBuildArtifact(id,data.jobId,actor,data);
    else if(data.action==='restart')await restartBuildJob(id,data.jobId,actor);
    else if(data.action==='retry_qa')await retryBuildQa(id,data.jobId,actor);
    else await cancelBuildJob(id,data.jobId,actor);
    return json(await listBuildJobs(id));
  }catch(error){return json({error:error instanceof BuildJobError?error.message:"Build operation unavailable. No execution success is claimed."},409);}
}
