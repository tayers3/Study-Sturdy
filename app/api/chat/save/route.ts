import { createClient } from "@/lib/supabase/server";
import { allAiModes, getAiModeLabel } from "@/lib/ai-modes";
import { z } from "zod";

const saveSchema = z.object({
  sessionId: z.string().uuid("Invalid session id"),
  query: z.string().min(3),
  response: z.object({
    mode: z.enum(allAiModes).optional(),
    answer: z.string(),
    steps: z.array(z.string()).optional(),
    quickTips: z.array(z.string()).optional(),
    flashcards: z
      .array(
        z.object({
          term: z.string(),
          definition: z.string(),
        })
      )
      .optional(),
    videoSuggestion: z
      .object({
        title: z.string(),
        url: z.string(),
      })
      .optional(),
    slides: z
      .array(
        z.object({
          title: z.string(),
          content: z.string().optional(),
          bulletPoints: z.array(z.string()),
        })
      )
      .optional(),
    audioScript: z.string().optional(),
    audioSections: z
      .array(
        z.object({
          heading: z.string(),
          content: z.string(),
        })
      )
      .optional(),
    mindmap: z
      .object({
        centralTopic: z.string(),
        branches: z.array(
          z.object({
            topic: z.string(),
            subtopics: z.array(z.string()),
          })
        ),
      })
      .optional(),
    quizQuestions: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()),
          correctIndex: z.number(),
          explanation: z.string(),
        })
      )
      .optional(),
    summary: z
      .object({
        title: z.string(),
        overview: z.string(),
        keyPoints: z.array(z.string()),
      })
      .optional(),
  }),
});

function buildNoteContent(payload: z.infer<typeof saveSchema>) {
  const lines: string[] = [];

  lines.push(`Question: ${payload.query}`);
  lines.push("");
  lines.push("Answer:");
  lines.push(payload.response.answer);

  if (payload.response.steps && payload.response.steps.length > 0) {
    lines.push("");
    lines.push("Steps:");
    payload.response.steps.forEach((step, idx) => lines.push(`${idx + 1}. ${step}`));
  }

  if (payload.response.flashcards && payload.response.flashcards.length > 0) {
    lines.push("");
    lines.push("Flashcards:");
    payload.response.flashcards.forEach((card) => {
      lines.push(`- ${card.term}: ${card.definition}`);
    });
  }

  if (payload.response.slides && payload.response.slides.length > 0) {
    lines.push("");
    lines.push("Slides:");
    payload.response.slides.forEach((slide, index) => {
      lines.push(`${index + 1}. ${slide.title}`);
      if (slide.content) {
        lines.push(`   ${slide.content}`);
      }
      slide.bulletPoints.forEach((point) => lines.push(`   - ${point}`));
    });
  }

  if (payload.response.audioScript) {
    lines.push("");
    lines.push("Audio Script:");
    lines.push(payload.response.audioScript);
  }

  if (payload.response.audioSections && payload.response.audioSections.length > 0) {
    lines.push("");
    lines.push("Audio Sections:");
    payload.response.audioSections.forEach((section) => {
      lines.push(`- ${section.heading}: ${section.content}`);
    });
  }

  if (payload.response.mindmap) {
    lines.push("");
    lines.push(`Mind Map: ${payload.response.mindmap.centralTopic}`);
    payload.response.mindmap.branches.forEach((branch) => {
      lines.push(`- ${branch.topic}: ${branch.subtopics.join(", ")}`);
    });
  }

  if (payload.response.quizQuestions && payload.response.quizQuestions.length > 0) {
    lines.push("");
    lines.push("Quiz Questions:");
    payload.response.quizQuestions.forEach((question, index) => {
      lines.push(`${index + 1}. ${question.question}`);
      question.options.forEach((option, optionIndex) => {
        const prefix = optionIndex === question.correctIndex ? "*" : "-";
        lines.push(`   ${prefix} ${option}`);
      });
      lines.push(`   Explanation: ${question.explanation}`);
    });
  }

  if (payload.response.summary) {
    lines.push("");
    lines.push(payload.response.summary.title);
    lines.push(payload.response.summary.overview);
    payload.response.summary.keyPoints.forEach((point) => lines.push(`- ${point}`));
  }

  if (payload.response.videoSuggestion) {
    lines.push("");
    lines.push("Recommended Video:");
    lines.push(`${payload.response.videoSuggestion.title} - ${payload.response.videoSuggestion.url}`);
  }

  return lines.join("\n");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Please sign in to save results." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = saveSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("study_sessions")
      .select("id")
      .eq("id", parsed.data.sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Study session not found." }, { status: 404 });
    }

    const title = `AI Search (${getAiModeLabel(parsed.data.response.mode)}): ${parsed.data.query}`.slice(
      0,
      120
    );

    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        session_id: parsed.data.sessionId,
        user_id: user.id,
        title,
        content: buildNoteContent(parsed.data),
        file_type: "text",
      })
      .select("id")
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    if (!note?.id) {
      return Response.json({ error: "Could not save note." }, { status: 500 });
    }

    return Response.json({ success: true, noteId: note.id });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to save search result",
      },
      { status: 500 }
    );
  }
}
