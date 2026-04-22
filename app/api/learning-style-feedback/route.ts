import { generateText, Output } from "ai";
import { z } from "zod";

const inputSchema = z.object({
  description: z.string().min(20, "Please provide a bit more detail about how you learn best."),
});

const feedbackSchema = z.object({
  recommendedFormat: z.enum(["slideshow", "audio", "flashcards", "mindmap", "quiz", "summary"]),
  reason: z.string(),
  studyPlan: z.array(z.string()).min(3).max(5),
  aiFeedback: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = inputSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: feedbackSchema }),
      prompt: `A student shared this learning preference description:\n\n"${parsed.data.description}"\n\nBased on that description, pick the single best study format from this list: slideshow, audio, flashcards, mindmap, quiz, summary.\n\nReturn:\n1) recommendedFormat: one of the allowed values\n2) reason: a short explanation (2-4 sentences)\n3) studyPlan: 3-5 actionable tips tied to the recommended format\n4) aiFeedback: encouraging coaching feedback tailored to their habits and challenges`,
    });

    return Response.json(result.object);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
