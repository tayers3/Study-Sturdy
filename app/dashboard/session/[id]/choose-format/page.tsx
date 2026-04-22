"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LearningFormat = "slideshow" | "audio" | "flashcards" | "mindmap" | "quiz" | "summary";

interface FeedbackResponse {
  recommendedFormat: LearningFormat;
  reason: string;
  studyPlan: string[];
  aiFeedback: string;
}

const formatLabel: Record<LearningFormat, string> = {
  slideshow: "Slideshow",
  audio: "Audio",
  flashcards: "Flashcards",
  mindmap: "Mind Map",
  quiz: "Quiz",
  summary: "Summary",
};

export default function ChooseFormatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (description.trim().length < 20) {
      setError("Please share a little more detail so AI can recommend the best format.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/learning-style-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: description.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to generate feedback right now");
      }

      setFeedback(data as FeedbackResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/dashboard/session/${sessionId}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Session
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-6 h-6 text-primary" />
            Choose Your Best Learning Format
          </CardTitle>
          <CardDescription>
            Describe how you learn best, and AI will recommend the most effective format for this session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learning-style">How do you learn best?</Label>
              <Textarea
                id="learning-style"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={7}
                placeholder="Example: I remember concepts best when I can hear explanations first, then test myself with quick questions. I struggle with long dense text and prefer short chunks."
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Get AI Feedback
            </Button>
          </form>
        </CardContent>
      </Card>

      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              AI Recommendation: {formatLabel[feedback.recommendedFormat]}
            </CardTitle>
            <CardDescription>{feedback.reason}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Personalized AI Feedback</h3>
              <p className="text-sm text-muted-foreground">{feedback.aiFeedback}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Suggested Study Plan</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {feedback.studyPlan.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <Link href={`/dashboard/session/${sessionId}`}>
                <Button>Go Choose a Format</Button>
              </Link>
              <Link href={`/dashboard/session/${sessionId}/add-notes`}>
                <Button variant="outline">Upload More Notes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
