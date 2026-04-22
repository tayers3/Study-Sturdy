import { generateText, Output } from "ai";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(3, "Please enter at least 3 characters."),
});

const responseSchema = z.object({
  answer: z.string(),
  quickTips: z.array(z.string()).min(2).max(4),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: responseSchema }),
      prompt: `You are Study Sturdy AI, a concise and practical student tutor.

Student question:
${parsed.data.query}

Return:
1) answer: a clear explanation in simple language
2) quickTips: 2-4 practical next steps the student can take right now`,
    });

    return Response.json(result.object);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "AI request failed" },
      { status: 500 }
    );
  }
}
