import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(3, "Please enter at least 3 characters."),
});

const responseSchema = z.object({
  answer: z.string(),
  steps: z.array(z.string()).min(3).max(7),
  quickTips: z.array(z.string()).min(2).max(4),
});

export async function POST(request: Request) {
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

  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

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

      return Response.json(result.object);
    } catch {
      return Response.json(fallbackResponse(parsed.data.query));
    }
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "AI request failed",
      },
      { status: 500 }
    );
  }
}
