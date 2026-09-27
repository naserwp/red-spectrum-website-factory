import { z } from "zod";
import { chatSession,sendChatTurn,workspaceData } from "@/lib/webfactory/chat-store";
import { sameOrigin,rateLimit } from "@/lib/webfactory/server";
import { reviewActions } from "@/lib/webfactory/review-actions";
export const runtime="nodejs";
export const maxDuration=90;
const inputSchema=z.object({conversationId:z.string().uuid(),turnId:z.string().uuid(),requestId:z.string().uuid().optional(),customerSlug:z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),message:z.string().trim().min(1).max(4000),intent:z.string().refine(value=>value==='' || reviewActions.some(([id])=>id===value)).optional(),confirmed:z.literal(true)}).strict();
export async function POST(request:Request){
  const session=await chatSession();
  if(!session)return Response.json({error:"Please sign in."},{status:401});
  if(!await sameOrigin())return Response.json({error:"Invalid origin."},{status:403});
  if(!process.env.OPENAI_API_KEY?.trim())return Response.json({error:"AI generation unavailable"},{status:503});
  try{
    const raw=await request.text();if(raw.length>8000)return Response.json({error:"Message too long."},{status:400});
    const input=inputSchema.safeParse(JSON.parse(raw));if(!input.success)return Response.json({error:"Check the message and data-sharing confirmation."},{status:400});
    if(!await rateLimit("ai_chat",session,12))return Response.json({error:"Chat limit reached. Try again in 15 minutes."},{status:429});
    await sendChatTurn(session,input.data);
    const saved=await workspaceData(session,input.data.conversationId);
    return Response.json({messages:saved.messages},{headers:{"Cache-Control":"no-store"}});
  }catch{
    return Response.json({error:"Chat unavailable or another turn is pending. Refresh to check saved history. No automatic retry was made."},{status:400});
  }
}
