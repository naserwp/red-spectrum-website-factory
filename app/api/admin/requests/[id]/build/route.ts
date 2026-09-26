import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isAdmin, sameOrigin, rateLimit } from "@/lib/webfactory/server";
import { generateForRequest, transitionBuild, WorkflowError } from "@/lib/webfactory/ai-workflow";
export const runtime = "nodejs";
export const maxDuration = 90;
const inputSchema = z.object({
  action: z.enum(["generate","approve","preview","customer"]),
  confirmed: z.literal(true),
  briefId: z.string().uuid().optional(),
  previewUrl: z.string().url().max(500).optional(),
}).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!await sameOrigin()) return Response.json({ error: "Invalid origin." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return Response.json({ error: "Invalid request." }, { status: 400 });
  try {
    const raw = await request.text();
    if (raw.length > 2048) return Response.json({ error: "Invalid request." }, { status: 400 });
    const input = inputSchema.safeParse(JSON.parse(raw));
    if (!input.success) return Response.json({ error: "Review and confirm this action." }, { status: 400 });
    if (input.data.action === "generate") {
      if (!process.env.OPENAI_API_KEY?.trim()) return Response.json({ error: "AI generation unavailable" }, { status: 503 });
      if (!await rateLimit("ai", "admin", 6)) return Response.json({ error: "Generation limit reached. Try again in 15 minutes." }, { status: 429 });
      await generateForRequest(id);
    } else {
      if (!input.data.briefId) return Response.json({ error: "Select a generated brief." }, { status: 400 });
      await transitionBuild(id,input.data.action,input.data.briefId,input.data.previewUrl);
    }
    revalidatePath("/admin"); revalidatePath("/admin/requests/" + id); revalidatePath("/processing");
    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof WorkflowError ? error.message : "Workflow unavailable. Check storage/configuration and try again." }, { status: 400 });
  }
}
