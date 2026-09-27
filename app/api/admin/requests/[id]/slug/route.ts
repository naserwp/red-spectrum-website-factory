import {z} from "zod";
import {chatSession} from "@/lib/webfactory/chat-store";
import {sameOrigin,rateLimit} from "@/lib/webfactory/server";
import {setRequestSlug,SlugError} from "@/lib/webfactory/slugs";
export const runtime="nodejs";
const inputSchema=z.object({slug:z.string().max(80),action:z.enum(['check','save']),expectedSlug:z.string().nullable()}).strict();
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const session=await chatSession();if(!session)return Response.json({error:"Please sign in."},{status:401});
  if(!await sameOrigin())return Response.json({error:"Invalid origin."},{status:403});
  const {id}=await params;if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Invalid request."},{status:400});
  try{
    const body=await request.text();if(body.length>1000)return Response.json({error:"Invalid input."},{status:400});
    const input=inputSchema.safeParse(JSON.parse(body));if(!input.success)return Response.json({error:"Check the slug input."},{status:400});
    if(!await rateLimit('ai_chat',session,30))return Response.json({error:"Please wait before trying again."},{status:429});
    return Response.json(await setRequestSlug(id,input.data.slug,input.data.action==='save',session,input.data.expectedSlug),{headers:{'Cache-Control':'no-store'}});
  }catch(error){return Response.json({error:error instanceof SlugError?error.message:"Slug service unavailable. Check storage and refresh."},{status:400});}
}
