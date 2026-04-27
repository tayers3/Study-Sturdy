"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AssistantResponse {
  answer: string;
  steps: string[];
  quickTips: string[];
}

interface ChatMessage {
  id: string;
  query: string;
  response: AssistantResponse;
  timestamp: number;
}

export function StudentAiSearch() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery }),
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
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await askAssistant(query);
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
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or ask: Explain photosynthesis in simple terms"
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
            <div>
              <h3 className="font-medium mb-1">Answer</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.answer}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Step-by-Step</h3>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                {result.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-medium mb-1">Quick Tips</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {result.quickTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
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
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                    {new Date(message.timestamp).toLocaleDateString()}
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
