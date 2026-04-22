import { generateText, Output } from "ai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const slideshowSchema = z.object({
  slides: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      bulletPoints: z.array(z.string()),
    })
  ),
});

const flashcardsSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
});

const mindmapSchema = z.object({
  centralTopic: z.string(),
  branches: z.array(
    z.object({
      topic: z.string(),
      subtopics: z.array(z.string()),
    })
  ),
});

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
    })
  ),
});

const summarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  keyPoints: z.array(z.string()),
  details: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
    })
  ),
});

const audioSchema = z.object({
  title: z.string(),
  script: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
    })
  ),
});

const schemas: Record<string, z.ZodType> = {
  slideshow: slideshowSchema,
  flashcards: flashcardsSchema,
  mindmap: mindmapSchema,
  quiz: quizSchema,
  summary: summarySchema,
  audio: audioSchema,
};

const prompts: Record<string, string> = {
  slideshow: `Create a comprehensive slideshow presentation from the provided study notes. 
Generate 8-12 slides that cover the main topics. Each slide should have:
- A clear, concise title
- 2-3 sentences of main content
- 3-5 bullet points with key information
Structure the slides in a logical learning order, starting with an introduction and ending with a summary.`,

  flashcards: `Create study flashcards from the provided notes.
Generate 15-25 flashcards that test understanding of key concepts, definitions, and relationships.
Each card should have:
- A clear question or prompt on the front
- A comprehensive but concise answer on the back
Include a mix of definition cards, concept cards, and application questions.`,

  mindmap: `Create a mind map structure from the provided study notes.
Identify the central topic and create 4-7 main branches with 3-5 subtopics each.
The mind map should show relationships between concepts and help visualize the material's structure.`,

  quiz: `Create a comprehensive study quiz from the provided notes.
Generate 10-15 multiple choice questions that test understanding at various levels (recall, comprehension, application).
Each question should have:
- A clear question
- 4 answer options (one correct, three plausible distractors)
- The index of the correct answer (0-3)
- A brief explanation of why the answer is correct`,

  summary: `Create a condensed study summary from the provided notes.
Include:
- A clear title
- A 2-3 sentence overview
- 5-8 key takeaway points
- 3-5 detailed sections covering the main topics
The summary should be concise but comprehensive enough for quick review.`,

  audio: `Create an audio script from the provided study notes that can be converted to speech.
The script should:
- Have a clear title
- Be written in a conversational, easy-to-listen tone
- Be structured in sections with headings
- Include natural pauses and transitions
- Cover all key concepts in a way that's easy to understand by listening
Write as if you're explaining the material to a student in a podcast format.`,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, type } = await request.json();

  if (!sessionId || !type) {
    return Response.json({ error: "Missing sessionId or type" }, { status: 400 });
  }

  if (!schemas[type]) {
    return Response.json({ error: "Invalid generation type" }, { status: 400 });
  }

  // Get the session and verify ownership
  const { data: session } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  // Get all notes for this session
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  if (!notes || notes.length === 0) {
    return Response.json({ error: "No notes found for this session" }, { status: 400 });
  }

  // Combine all notes into a single text
  const combinedNotes = notes
    .map((note) => `## ${note.title}\n\n${note.content}`)
    .join("\n\n---\n\n");

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({
        schema: schemas[type],
      }),
      prompt: `${prompts[type]}\n\nStudy Notes:\n\n${combinedNotes}`,
    });

    // Save the generated material to the database
    const { data: material, error: insertError } = await supabase
      .from("generated_materials")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        type,
        content: result.object,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({ id: material.id, content: result.object });
  } catch (error) {
    console.error("Generation error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
