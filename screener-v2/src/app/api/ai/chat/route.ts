import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { checkAuthRateLimit } from "@/lib/server/rate-limit";
import { runStarryChat, type ChatMessage } from "@/lib/ai/client";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) }))
    .min(1)
    .max(30),
  candidateId: z.string().optional()
});

const SYSTEM_BASE = [
  "You are Starry, the built-in AI assistant for Northstar, a hiring/ATS platform.",
  "You help recruiters and hiring teams: summarize and review résumés, assess candidate-vs-role fit,",
  "draft screening questions, and draft professional candidate communications.",
  "Be concise, structured, and practical — prefer short paragraphs and bullet points.",
  "You INFORM and ASSIST — you never make the final hiring decision; the recruiter decides.",
  "Evaluate only job-relevant skills and experience. Never assess, infer, or reference protected",
  "characteristics (race, ethnicity, gender, age, religion, disability, national origin, marital/family status).",
  "If you lack data to answer, say so plainly rather than guessing."
].join(" ");

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const rate = await checkAuthRateLimit({
    request,
    identifier: auth.session.userId ?? undefined,
    scope: "ai-chat",
    ipMax: 40,
    idMax: 30,
    windowMs: 60_000
  });
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: rate.message }, { status: 429 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  let system = SYSTEM_BASE;
  let candidateId: string | undefined;

  // Ground the assistant in the candidate the user is viewing — only if they may view it.
  if (body.candidateId) {
    const perm = await requireCandidatePermission(auth.session, body.candidateId, "view_candidates");
    if (perm.ok) {
      const c = await prisma.candidate.findUnique({
        where: { id: body.candidateId },
        select: {
          fullName: true,
          currentTitle: true,
          location: true,
          stage: true,
          role: { select: { label: true } },
          notesSummary: true
        }
      });
      if (c) {
        candidateId = body.candidateId;
        system +=
          "\n\nCONTEXT — the user is viewing this candidate:" +
          `\nName: ${c.fullName}` +
          `\nCurrent title: ${c.currentTitle ?? "—"}` +
          `\nApplied role: ${c.role?.label ?? "—"}` +
          `\nStage: ${c.stage}` +
          `\nLocation: ${c.location ?? "—"}` +
          `\nRecruiter notes: ${c.notesSummary ?? "—"}` +
          "\nUse this context when relevant.";
      }
    }
  }

  const promptChars = body.messages.reduce((sum, m) => sum + m.content.length, 0);
  const result = await runStarryChat({ messages: body.messages as ChatMessage[], system });

  // Audit metadata only — never the prompt/response content (compliance guardrail).
  await prisma.aiInteractionLog
    .create({
      data: {
        userId: auth.session.userId ?? null,
        kind: "chat",
        candidateId: candidateId ?? null,
        promptChars,
        responseChars: result.ok ? result.text.length : 0,
        status: result.ok ? "ok" : result.code
      }
    })
    .catch(() => undefined);

  if (!result.ok) {
    const status = result.code === "not_configured" ? 503 : 502;
    return NextResponse.json({ ok: false, error: result.error, code: result.code }, { status });
  }
  return NextResponse.json({ ok: true, text: result.text });
}
