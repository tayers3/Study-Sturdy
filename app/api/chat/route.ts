import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { allAiModes, normalizeAiMode } from "@/lib/ai-modes";
import { findStoredLesson } from "@/lib/lesson-content";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(3, "Please enter at least 3 characters."),
  level: z.enum(allAiModes).default("summary"),
  useStoredContent: z.boolean().default(false),
});

type LearningMode = z.infer<typeof requestSchema>["level"];
type CanonicalLearningMode = ReturnType<typeof normalizeAiMode>;

const responseSchema = z.object({
  mode: z.enum(allAiModes).optional(),
  source: z.enum(["ai", "stored"]).optional(),
  answer: z.string(),
  steps: z.array(z.string()).min(1).max(7).optional(),
  quickTips: z.array(z.string()).min(1).max(4).optional(),
  flashcards: z
    .array(
      z.object({
        term: z.string(),
        definition: z.string(),
      })
    )
    .min(1)
    .max(10)
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
        bulletPoints: z.array(z.string()).min(1).max(5),
      })
    )
    .min(1)
    .max(8)
    .optional(),
  audioScript: z.string().optional(),
  audioSections: z
    .array(
      z.object({
        heading: z.string(),
        content: z.string(),
      })
    )
    .min(1)
    .max(6)
    .optional(),
  mindmap: z
    .object({
      centralTopic: z.string(),
      branches: z.array(
        z.object({
          topic: z.string(),
          subtopics: z.array(z.string()).min(1).max(5),
        })
      ),
    })
    .optional(),
  quizQuestions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().min(0).max(3),
        explanation: z.string(),
      })
    )
    .min(1)
    .max(8)
    .optional(),
  summary: z
    .object({
      title: z.string(),
      overview: z.string(),
      keyPoints: z.array(z.string()).min(1).max(6),
    })
    .optional(),
});

type AssistantResponse = z.infer<typeof responseSchema>;

type ChatRow = {
  id: string;
  query: string;
  response: AssistantResponse;
  created_at: string;
};

const learningModePrompt: Record<CanonicalLearningMode, string> = {
  slideshow:
    "Organize the answer like a slideshow outline with a logical slide sequence, compact explanations, and key bullets per slide.",
  audio:
    "Write like a spoken lesson with natural pacing, smooth transitions, and short sections that are easy to follow by listening.",
  flashcards:
    "Format the explanation for flashcard study: concise definitions, key terms, and testable facts.",
  mindmap:
    "Explain the topic as a concept map: identify the central idea, main branches, and linked subtopics.",
  quiz:
    "Teach the concept clearly, then include strong multiple-choice questions that test recall and understanding.",
  summary:
    "Structure the response as clean study notes with headings, core points, and concise explanation for quick review.",
};

function extractKeyPoints(text: string, query: string): string[] {
  const points = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .slice(0, 4);

  if (points.length > 0) {
    return points;
  }

  return [
    `Define the main idea behind ${query}.`,
    "Identify the most important supporting concept.",
    "Review one example or application.",
  ];
}

function fallbackResponse(query: string) {
  const needsSteps = /\b(step|steps|solve|process|method|how to)\b/i.test(query);

  return {
    answer: `Here is a quick way to tackle: "${query}"\n\nStart by writing what you already know in 2-3 bullet points. Then define the core concept in one sentence, and add a simple example from class or real life. If possible, teach it out loud in your own words as if explaining to a friend.`,
    ...(needsSteps
      ? {
          steps: [
            "Read the prompt carefully and identify what is being asked.",
            "List known facts or formulas before attempting the solution.",
            "Solve in a clear sequence and verify the final result.",
          ],
        }
      : {}),
  };
}

function ensureFlashcards(
  response: AssistantResponse,
  query: string,
  level: CanonicalLearningMode
): AssistantResponse {
  if (level !== "flashcards") {
    return response;
  }

  if (response.flashcards && response.flashcards.length > 0) {
    return response;
  }

  return {
    ...response,
    flashcards: [
      {
        term: query,
        definition:
          "Core concept from your query. Use the answer above to expand this into a complete study definition.",
      },
    ],
  };
}

function ensureMode(response: AssistantResponse, level: LearningMode): AssistantResponse {
  const normalizedLevel = normalizeAiMode(level);

  if (response.mode && normalizeAiMode(response.mode) === normalizedLevel) {
    return response;
  }

  return {
    ...response,
    mode: normalizedLevel,
  };
}

function ensureSlideshow(
  response: AssistantResponse,
  query: string,
  level: CanonicalLearningMode
): AssistantResponse {
  if (level !== "slideshow" || (response.slides && response.slides.length > 0)) {
    return response;
  }

  const keyPoints = extractKeyPoints(response.answer, query);

  return {
    ...response,
    slides: [
      {
        title: `Overview of ${query}`,
        content: response.answer,
        bulletPoints: keyPoints.slice(0, 3),
      },
      {
        title: "Key Takeaways",
        bulletPoints: keyPoints.slice(0, 4),
      },
    ],
  };
}

function ensureAudio(
  response: AssistantResponse,
  query: string,
  level: CanonicalLearningMode
): AssistantResponse {
  if (level !== "audio") {
    return response;
  }

  if (response.audioScript && response.audioSections && response.audioSections.length > 0) {
    return response;
  }

  const keyPoints = extractKeyPoints(response.answer, query);

  return {
    ...response,
    audioScript:
      response.audioScript ??
      `Today we are reviewing ${query}. ${response.answer} Focus on these ideas: ${keyPoints.join(" ")}`,
    audioSections:
      response.audioSections ??
      [
        {
          heading: "Introduction",
          content: `Start with the big idea behind ${query}.`,
        },
        {
          heading: "Core Concepts",
          content: keyPoints.join(" "),
        },
        {
          heading: "Review",
          content: "Repeat the main ideas and explain them out loud in your own words.",
        },
      ],
  };
}

function ensureMindmap(
  response: AssistantResponse,
  query: string,
  level: CanonicalLearningMode
): AssistantResponse {
  if (level !== "mindmap" || response.mindmap) {
    return response;
  }

  const keyPoints = extractKeyPoints(response.answer, query);

  return {
    ...response,
    mindmap: {
      centralTopic: query,
      branches: keyPoints.slice(0, 3).map((point, index) => ({
        topic: `Branch ${index + 1}`,
        subtopics: [point],
      })),
    },
  };
}

function ensureQuiz(
  response: AssistantResponse,
  query: string,
  level: CanonicalLearningMode
): AssistantResponse {
  if (level !== "quiz" || (response.quizQuestions && response.quizQuestions.length > 0)) {
    return response;
  }

  return {
    ...response,
    quizQuestions: [
      {
        question: `Which statement best matches the core idea of ${query}?`,
        options: [
          response.answer.slice(0, 120) || `A correct summary of ${query}`,
          `An unrelated detail about ${query}`,
          `A contradiction of ${query}`,
          `A topic from a different subject area`,
        ],
        correctIndex: 0,
        explanation: "The first option matches the explanation returned by the assistant.",
      },
    ],
  };
}

function ensureSummary(
  response: AssistantResponse,
  query: string,
  level: CanonicalLearningMode
): AssistantResponse {
  if (level !== "summary" || response.summary) {
    return response;
  }

  const keyPoints = extractKeyPoints(response.answer, query);

  return {
    ...response,
    summary: {
      title: `Summary: ${query}`,
      overview: keyPoints[0] ?? response.answer,
      keyPoints,
    },
  };
}

function ensureNoteTakerSteps(
  response: AssistantResponse,
  query: string,
  level: LearningMode
): AssistantResponse {
  const normalizedLevel = normalizeAiMode(level);

  if (level !== "note_taker" && normalizedLevel !== "summary") {
    return response;
  }

  if (response.steps && response.steps.length > 0) {
    return response;
  }

  return {
    ...response,
    steps: [
      `Identify the exact task in: "${query}" and note what output is required.`,
      "List known definitions, formulas, or facts that apply to the problem.",
      "Apply the method in logical order, showing each transformation or inference clearly.",
      "Check the result against the original prompt and verify units/conditions.",
    ],
  };
}

function toYouTubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function ensureVideoSuggestion(
  response: AssistantResponse,
  query: string,
  level: LearningMode
): AssistantResponse {
  if (level !== "visual_learner") {
    return response;
  }

  if (response.videoSuggestion?.url) {
    return response;
  }

  return {
    ...response,
    videoSuggestion: {
      title: `YouTube video for: ${query}`,
      url: toYouTubeSearchUrl(query),
    },
  };
}

function buildStoredLessonResponse(
  query: string,
  lessonData: NonNullable<ReturnType<typeof findStoredLesson>>
): AssistantResponse {
  const { subject, topic, lesson } = lessonData;

  return {
    source: "stored",
    answer:
      lesson.summary ??
      `Stored lesson content found for ${subject}: ${topic}. Use the saved steps and practice items below.`,
    steps: lesson.steps,
    quickTips: lesson.practice?.slice(0, 4).map((item) => `Practice: ${item}`),
    summary: {
      title: `Stored Lesson: ${topic}`,
      overview:
        lesson.summary ??
        `Review ${topic} in ${subject} with the stored steps and examples.`,
      keyPoints: lesson.steps?.slice(0, 4) ?? [
        `Subject: ${subject}`,
        `Topic: ${topic}`,
        `Query: ${query}`,
      ],
    },
    videoSuggestion: lesson.visual
      ? {
          title: `${topic} visual lesson`,
          url: lesson.visual,
        }
      : undefined,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ messages: [] });
  }

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("id, query, response, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[api/chat] Could not load chat history", {
      userId: user.id,
      error: error.message,
    });
    return Response.json({ messages: [] });
  }

  const messages = ((data ?? []) as ChatRow[]).map((message) => ({
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

  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    let assistantResponse: AssistantResponse;
    const requestedMode = normalizeAiMode(parsed.data.level);

    if (parsed.data.useStoredContent) {
      const storedLesson = findStoredLesson(parsed.data.query);

      if (!storedLesson) {
        return Response.json(
          {
            error:
              "No stored lesson found for that topic yet. Try disabling stored content or expand the lessons library.",
          },
          { status: 404 }
        );
      }

      assistantResponse = ensureMode(
        ensureNoteTakerSteps(
          ensureFlashcards(
            ensureSummary(
              ensureQuiz(
                ensureMindmap(
                  ensureAudio(
                    ensureSlideshow(
                      ensureVideoSuggestion(
                        buildStoredLessonResponse(parsed.data.query, storedLesson),
                        parsed.data.query,
                        parsed.data.level
                      ),
                      parsed.data.query,
                      requestedMode
                    ),
                    parsed.data.query,
                    requestedMode
                  ),
                  parsed.data.query,
                  requestedMode
                ),
                parsed.data.query,
                requestedMode
              ),
              parsed.data.query,
              requestedMode
            ),
            parsed.data.query,
            requestedMode
          ),
          parsed.data.query,
          parsed.data.level
        ),
        parsed.data.level
      );
    } else {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY environment variable not set");
        }

        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a high-level academic assistant.

- Give direct, correct answers first
- Be concise
- Use proper math/technical reasoning
- Do NOT explain like a child
- Avoid unnecessary sections like "quick tips"
${learningModePrompt[requestedMode]}

Question: ${parsed.data.query}

Return a JSON object with:
1) answer: a direct and accurate response
2) steps: optional array when a process or method would help the student learn
3) quickTips: optional array (only include when explicitly helpful)
4) slides: for slideshow mode, include 4-8 slide objects with title, optional content, and bulletPoints
5) audioScript and audioSections: for audio mode, include a spoken script and 3-5 sections
6) flashcards: for flashcards mode, include 4-8 term-definition pairs relevant to the question
7) mindmap: for mindmap mode, include a centralTopic and branches with subtopics
8) quizQuestions: for quiz mode, include 4-8 multiple-choice questions with 4 options, correctIndex, and explanation
9) summary: for summary mode, include title, overview, and 3-6 keyPoints
10) videoSuggestion: optional, only when a video would genuinely help

Return ONLY valid JSON, no markdown or extra text.`,
                },
              ],
            },
          ],
        });

        const textContent = result.response.text();

        // Parse JSON from response
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Could not parse JSON from Gemini response");
        }

        const parsedResponse = JSON.parse(jsonMatch[0]);
        assistantResponse = ensureMode(
          ensureNoteTakerSteps(
            ensureFlashcards(
              ensureSummary(
                ensureQuiz(
                  ensureMindmap(
                    ensureAudio(
                      ensureSlideshow(
                        ensureVideoSuggestion(
                          responseSchema.parse({ ...parsedResponse, source: "ai" }),
                          parsed.data.query,
                          parsed.data.level
                        ),
                        parsed.data.query,
                        requestedMode
                      ),
                      parsed.data.query,
                      requestedMode
                    ),
                    parsed.data.query,
                    requestedMode
                  ),
                  parsed.data.query,
                  requestedMode
                ),
                parsed.data.query,
                requestedMode
              ),
              parsed.data.query,
              requestedMode
            ),
            parsed.data.query,
            parsed.data.level
          ),
          parsed.data.level
        );
      } catch (error) {
        console.error("[api/chat] Gemini generation failed", {
          query: parsed.data.query,
          level: parsed.data.level,
          error: error instanceof Error ? error.message : String(error),
        });

        assistantResponse = ensureMode(
          ensureNoteTakerSteps(
            ensureFlashcards(
              ensureSummary(
                ensureQuiz(
                  ensureMindmap(
                    ensureAudio(
                      ensureSlideshow(
                        ensureVideoSuggestion(
                          { ...fallbackResponse(parsed.data.query), source: "ai" },
                          parsed.data.query,
                          parsed.data.level
                        ),
                        parsed.data.query,
                        requestedMode
                      ),
                      parsed.data.query,
                      requestedMode
                    ),
                    parsed.data.query,
                    requestedMode
                  ),
                  parsed.data.query,
                  requestedMode
                ),
                parsed.data.query,
                requestedMode
              ),
              parsed.data.query,
              requestedMode
            ),
            parsed.data.query,
            parsed.data.level
          ),
          parsed.data.level
        );
      }
    }

    if (!user) {
      return Response.json({
        message: {
          id: `guest-${Date.now()}`,
          query: parsed.data.query,
          response: assistantResponse,
          timestamp: Date.now(),
        },
      });
    }

    try {
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
        console.warn("[api/chat] Could not persist chat message", {
          userId: user.id,
          query: parsed.data.query,
          error: insertError.message,
        });

        return Response.json({
          message: {
            id: `ephemeral-${Date.now()}`,
            query: parsed.data.query,
            response: assistantResponse,
            timestamp: Date.now(),
          },
        });
      }

      if (!savedMessage) {
        return Response.json({
          message: {
            id: `ephemeral-${Date.now()}`,
            query: parsed.data.query,
            response: assistantResponse,
            timestamp: Date.now(),
          },
        });
      }

      return Response.json({
        message: {
          id: savedMessage.id,
          query: savedMessage.query,
          response: savedMessage.response,
          timestamp: new Date(savedMessage.created_at).getTime(),
        },
      });
    } catch (persistError) {
      console.warn("[api/chat] Persist threw unexpectedly", {
        userId: user.id,
        query: parsed.data.query,
        error: persistError instanceof Error ? persistError.message : String(persistError),
      });

      return Response.json({
        message: {
          id: `ephemeral-${Date.now()}`,
          query: parsed.data.query,
          response: assistantResponse,
          timestamp: Date.now(),
        },
      });
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

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ success: true });
  }

  const { error } = await supabase
    .from("ai_chat_messages")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.warn("[api/chat] Could not clear chat history", {
      userId: user.id,
      error: error.message,
    });
    return Response.json({ success: true });
  }

  return Response.json({ success: true });
}