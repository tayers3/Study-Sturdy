type StoredLesson = {
  visual?: string;
  practice?: string[];
  steps?: string[];
  summary?: string;
};

type LessonTopicMap = Record<string, StoredLesson>;
type LessonLibrary = Record<string, LessonTopicMap>;

// Expand this object with additional subjects and topics over time.
export const lessons: LessonLibrary = {
  algebra: {
    "solving equations": {
      visual: "https://www.youtube.com/results?search_query=solving+linear+equations",
      practice: ["2x+3=7", "x-5=10", "3x+9=0"],
      steps: [
        "Step 1: Simplify both sides if needed.",
        "Step 2: Move constant terms away from the variable.",
        "Step 3: Divide or multiply to isolate the variable.",
        "Step 4: Substitute back to verify the solution.",
      ],
      summary: "Solve equations by isolating the variable using inverse operations in a clear sequence.",
    },
  },
};

function normalizeText(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

export function findStoredLesson(query: string):
  | {
      subject: string;
      topic: string;
      lesson: StoredLesson;
    }
  | null {
  const normalizedQuery = normalizeText(query);

  for (const [subject, topics] of Object.entries(lessons)) {
    for (const [topic, lesson] of Object.entries(topics)) {
      const normalizedSubject = normalizeText(subject);
      const normalizedTopic = normalizeText(topic);
      if (
        normalizedQuery.includes(normalizedTopic) ||
        (normalizedQuery.includes(normalizedSubject) && normalizedQuery.includes(normalizedTopic.split(" ")[0]))
      ) {
        return { subject, topic, lesson };
      }
    }
  }

  return null;
}