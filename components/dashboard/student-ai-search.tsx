"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Sparkles, X } from "lucide-react";
import { canonicalAiModes, getAiModeLabel, normalizeAiMode, type AiMode, type CanonicalAiMode } from "@/lib/ai-modes";
import { formatStableDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AssistantResponse {
  mode?: AiMode;
  source?: "ai" | "stored";
  answer: string;
  steps?: string[];
  quickTips?: string[];
  flashcards?: Array<{
    term: string;
    definition: string;
  }>;
  videoSuggestion?: {
    title: string;
    url: string;
  };
  slides?: Array<{
    title: string;
    content?: string;
    bulletPoints: string[];
  }>;
  audioScript?: string;
  audioSections?: Array<{
    heading: string;
    content: string;
  }>;
  mindmap?: {
    centralTopic: string;
    branches: Array<{
      topic: string;
      subtopics: string[];
    }>;
  };
  quizQuestions?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  summary?: {
    title: string;
    overview: string;
    keyPoints: string[];
  };
}

type LearningMode = CanonicalAiMode;

interface ChatMessage {
  id: string;
  query: string;
  response: AssistantResponse;
  timestamp: number;
}

export function StudentAiSearch() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LearningMode>("summary");
  const [useStoredContent, setUseStoredContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const hasAutoAsked = useRef(false);

  // Load chat history from the API on mount so reload restores previous responses.
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/chat", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load chat history");
        }


        const history = (data.messages ?? []) as ChatMessage[];

        if (cancelled) {
          return;
        }

        setMessages(history);

        if (history.length > 0) {
          setQuery(history[0].query);
          setResult(history[0].response);
        }

        const sessionsResponse = await fetch("/api/study-sessions", {
          method: "GET",
          cache: "no-store",
        });

        const sessionsData = await sessionsResponse.json();
        if (!sessionsResponse.ok) {
          throw new Error(sessionsData.error ?? "Could not load study sessions");
        }

        const loadedSessions = (sessionsData.sessions ?? []) as Array<{ id: string; title: string }>;
        setSessions(loadedSessions);
        if (loadedSessions.length > 0) {
          setSelectedSessionId(loadedSessions[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load chat history");
        }
      }
    }
    
    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const askAssistant = useCallback(async (rawQuery: string) => {
    const trimmedQuery = rawQuery.trim();
    setError(null);

    if (trimmedQuery.length < 3) {
      setError("Type at least 3 characters to ask Study Sturdy AI.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSaveStatus(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery, level, useStoredContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not get an AI response");
      }

      const newMessage = data.message as ChatMessage;
      setResult(newMessage.response);
      setMessages((prev) => [newMessage, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [level, useStoredContent]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await askAssistant(query);
  }

  async function saveToSession() {
    if (!result) {
      return;
    }

    if (!selectedSessionId) {
      setSaveStatus("Choose a study session first.");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch("/api/chat/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          query,
          response: result,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save result");
      }

      setSaveStatus("Saved to your study session.");
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : "Could not save result");
    } finally {
      setIsSaving(false);
    }
  }

  const clearHistory = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not clear chat history");
      }

      setMessages([]);
      setResult(null);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear chat history");
    }
  }, []);

  useEffect(() => {
    const prefetchedQuestion = searchParams.get("q");
    if (!prefetchedQuestion || hasAutoAsked.current) {
      return;
    }

    hasAutoAsked.current = true;
    setQuery(prefetchedQuestion);
    void askAssistant(prefetchedQuestion);
  }, [askAssistant, searchParams]);

  const activeMode = normalizeAiMode(result?.mode ?? level);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          Ask Study Sturdy AI
        </CardTitle>
        <CardDescription>
          Use the search bar to ask study questions and get quick learning guidance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or ask: Explain photosynthesis in simple terms"
              className="h-11 pl-9 text-base"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as LearningMode)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Select learning style"
            >
              {canonicalAiModes.map((mode) => (
                <option key={mode} value={mode}>
                  {getAiModeLabel(mode)}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={isLoading} className="h-11 w-full sm:w-auto sm:px-6">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
            </Button>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={useStoredContent}
              onChange={(e) => setUseStoredContent(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Use stored lesson content (no AI generation)
          </label>
        </form>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
            <div>
              <h3 className="font-medium mb-1">
                Answer
                {result.source && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {result.source === "stored" ? "Stored Content" : "AI"}
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{result.answer}</p>
            </div>
            {result.summary && activeMode === "summary" && (
              <div>
                <h3 className="font-medium mb-1">{result.summary.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {result.summary.overview}
                </p>
                {result.summary.keyPoints.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                    {result.summary.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {result.steps && result.steps.length > 0 && (
              <div>
                <h3 className="font-medium mb-1">Step-by-Step</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  {result.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {result.quickTips && result.quickTips.length > 0 && (
              <div>
                <h3 className="font-medium mb-1">Quick Tips</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.quickTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            {activeMode === "slideshow" && result.slides && result.slides.length > 0 && (
              <div>
                <h3 className="font-medium mb-1">Slide Outline</h3>
                <div className="space-y-2">
                  {result.slides.map((slide, index) => (
                    <div key={`${slide.title}-${index}`} className="rounded-md border border-border/60 bg-background/60 p-3">
                      <p className="text-sm font-medium">{index + 1}. {slide.title}</p>
                      {slide.content && (
                        <p className="text-sm text-muted-foreground mt-1 break-words">{slide.content}</p>
                      )}
                      <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                        {slide.bulletPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeMode === "audio" && (result.audioScript || (result.audioSections && result.audioSections.length > 0)) && (
              <div className="space-y-2">
                <h3 className="font-medium mb-1">Audio Lesson</h3>
                {result.audioScript && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{result.audioScript}</p>
                )}
                {result.audioSections && result.audioSections.length > 0 && (
                  <div className="space-y-2">
                    {result.audioSections.map((section) => (
                      <div key={section.heading} className="rounded-md border border-border/60 bg-background/60 p-3">
                        <p className="text-sm font-medium">{section.heading}</p>
                        <p className="text-sm text-muted-foreground mt-1 break-words">{section.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeMode === "flashcards" && result.flashcards && result.flashcards.length > 0 && (
              <div>
                <h3 className="font-medium mb-1">Flashcards</h3>
                <div className="space-y-2">
                  {result.flashcards.map((card) => (
                    <div key={`${card.term}-${card.definition}`} className="rounded-md border border-border/60 bg-background/60 p-3">
                      <p className="text-sm font-medium">{card.term}</p>
                      <p className="text-sm text-muted-foreground mt-1 break-words">{card.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeMode === "mindmap" && result.mindmap && (
              <div>
                <h3 className="font-medium mb-1">Mind Map</h3>
                <div className="rounded-md border border-border/60 bg-background/60 p-3 space-y-2">
                  <p className="text-sm font-medium">Central Topic: {result.mindmap.centralTopic}</p>
                  {result.mindmap.branches.map((branch) => (
                    <div key={branch.topic}>
                      <p className="text-sm font-medium">{branch.topic}</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mt-1">
                        {branch.subtopics.map((subtopic) => (
                          <li key={subtopic}>{subtopic}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeMode === "quiz" && result.quizQuestions && result.quizQuestions.length > 0 && (
              <div>
                <h3 className="font-medium mb-1">Quiz</h3>
                <div className="space-y-3">
                  {result.quizQuestions.map((question, index) => (
                    <div key={`${question.question}-${index}`} className="rounded-md border border-border/60 bg-background/60 p-3 space-y-2">
                      <p className="text-sm font-medium">{index + 1}. {question.question}</p>
                      <ol className="list-[upper-alpha] pl-5 text-sm text-muted-foreground space-y-1">
                        {question.options.map((option, optionIndex) => (
                          <li key={`${question.question}-${option}`}>
                            {option}
                            {optionIndex === question.correctIndex ? " (correct)" : ""}
                          </li>
                        ))}
                      </ol>
                      <p className="text-xs text-muted-foreground">{question.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.videoSuggestion && (
              <div>
                <h3 className="font-medium mb-1">Recommended Video</h3>
                <a
                  href={result.videoSuggestion.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline underline-offset-2 break-all"
                >
                  {result.videoSuggestion.title}
                </a>
              </div>
            )}

            <div className="border-t border-border/50 pt-3 space-y-2">
              <h3 className="font-medium text-sm">Save To Study Session</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  aria-label="Choose study session"
                >
                  <option value="">Select a study session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </select>
                <Button onClick={saveToSession} disabled={isSaving || !selectedSessionId} className="sm:px-5">
                  {isSaving ? "Saving..." : "Save Result"}
                </Button>
              </div>
              {saveStatus && <p className="text-xs text-muted-foreground">{saveStatus}</p>}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Chat History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto sm:max-h-96">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg border border-border/40 bg-background/50 p-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery(message.query);
                    setResult(message.response);
                  }}
                >
                  <p className="font-medium text-foreground line-clamp-1">{message.query}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatStableDate(new Date(message.timestamp))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
