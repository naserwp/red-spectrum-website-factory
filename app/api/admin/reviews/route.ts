import { chatSession } from "@/lib/webfactory/chat-store";
import { sameOrigin,rateLimit } from "@/lib/webfactory/server";
import { reviewInput,saveReview } from "@/lib/webfactory/reviews";
export const runtime="nodejs";
export async function POST(request:Request){
  const session=await chatSession();
  if(!session)return Response.json({error:"Please sign in."},{status:401});
  if(!await sameOrigin())return Response.json({error:"Invalid origin."},{status:403});
  try{
    const raw=await request.text();
    if(raw.length>24000)return Response.json({error:"Review too long."},{status:400});
    const input=reviewInput.safeParse(JSON.parse(raw));
    if(!input.success)return Response.json({error:"Check review fields and confirm the save."},{status:400});
    if(!await rateLimit("ai_chat",session,30))return Response.json({error:"Please wait before saving more reviews."},{status:429});
    await saveReview(session,input.data);
    return Response.json({saved:true},{headers:{"Cache-Control":"no-store"}});
  }catch{return Response.json({error:"Review not saved. Check the approved stage, exact customer preview URL, and answer ownership. Refresh before retrying."},{status:400});}
}
