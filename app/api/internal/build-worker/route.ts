import { workerAuthorized,workerOperation } from "@/lib/webfactory/build-worker";
import { workerInput } from "@/lib/webfactory/worker-contract";
export const runtime="nodejs";
export const maxDuration=90;
export async function POST(request:Request){
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
 if(!workerAuthorized(request.headers.get("authorization")))return reply({error:"Unauthorized"},401);
 try{
  // Six pages at seven widths exceed the old five-page report budget.
  const text=await request.text();if(text.length>128000)return reply({error:"Invalid worker request"},400);
  const parsed=workerInput.safeParse(JSON.parse(text));if(!parsed.success)return reply({error:"Invalid worker request"},400);
  return reply(await workerOperation(parsed.data));
 }catch{return reply({error:"Worker operation rejected. Check lease, stage, cancellation and verification."},409);}
}
