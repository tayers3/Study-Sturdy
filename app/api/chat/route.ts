import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(3, "Please enter at least 3 characters."),
});

const responseSchema = z.object({
  answer: z.string(),
  steps: z.array(z.string()).min(3).max(7),
  quickTips: z.array(z.string()).min(2).max(4),
});

function fallbackResponse(query: string) {
  return {
    answer: `Here is a quick way to tackle: "${query}"\n\nStart by writing what you already know in 2-3 bullet points. Then define the core concept in one sentence, and add a simple example from class or real life. If possible, teach it out loud in your own words as if explaining to a friend.`,
    steps: [
      "Read the question carefully and underline key words that tell you what to solve.",
      "Write down the known information, formulas, or definitions you can use.",
      "Choose one method and solve in small steps, showing each move clearly.",
      "Check your result by plugging it back in or comparing it to what the question asked.",
    ],
    quickTips: [
      "Break the question into smaller parts and answer one part at a time.",
      "Use the Feynman method: explain it in plain language without jargon.",
      "Create 3 flashcards: definition, example, and a common mistake.",
    ],
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("id, query, response, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const messages = (data ?? []).map((message) => ({
    id: message.id,
    query: message.query,
    response: message.response,
    timestamp: new Date(message.created_at).getTime(),
  }));

  return Response.json({ messages });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    let assistantResponse;

    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        output: Output.object({ schema: responseSchema }),
        prompt: `You are Study Sturdy AI, a concise and practical student tutor.

Student question:
${parsed.data.query}

Return:
1) answer: a clear explanation in simple language
2) steps: 3-7 numbered, actionable steps to solve this specific problem
3) quickTips: 2-4 practical next steps the student can take right now`,
      });

      assistantResponse = result.object;
    } catch {
      assistantResponse = fallbackResponse(parsed.data.query);
    }

    const { data: savedMessage, error: insertError } = await supabase
      .from("ai_chat_messages")
      .insert({
        user_id: user.id,
        query: parsed.data.query,
        response: assistantResponse,
      })
      .select("id, query, response, created_at")
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({
      message: {
        id: savedMessage.id,
        query: savedMessage.query,
        response: savedMessage.response,
        timestamp: new Date(savedMessage.created_at).getTime(),
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "AI request failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("ai_chat_messages")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}