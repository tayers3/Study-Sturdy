"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, CheckCircle2, ChevronRight, UserRound, XCircle } from "lucide-react";
import { content, type LearningStyle } from "@/lib/study-content";

type UserMode = "guest" | "logged-in";
type PracticeStatus = "correct" | "incorrect" | null;

type StepPhotoNote = {
  id: string;
  src: string;
  fileName: string;
  linkedStep: number;
  note: string;
  brightness: number;
  contrast: number;
};

type SavedNote = {
  id: string;
  title: string;
  style: LearningStyle;
  subject: string;
  topic: string;
  content: string;
  createdAt: number;
};

const learningStyleOptions: Array<{ key: LearningStyle; label: string; description: string }> = [
  {
    key: "visual",
    label: "Visual",
    description: "Diagrams, links, and visual cues to map concepts quickly.",
  },
  {
    key: "step-by-step",
    label: "Step by Step by You!",
    description: "Sequential breakdowns you can follow one action at a time.",
  },
  {
    key: "practice",
    label: "Practice",
    description: "Interactive questions with instant answer checking.",
  },
  {
    key: "summary",
    label: "Summary",
    description: "Fast key-point recaps for exam-style review.",
  },
];

const STYLE_STORAGE_KEY = "study-sturdy-learning-style";
const MY_NOTES_STORAGE_KEY = "study-sturdy-my-notes";
const STEP_BY_STEP_EXCLUDED_TOPICS = new Set(["Solving Linear Equations"]);

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function formatSavedDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const [userMode, setUserMode] = useState<UserMode>("guest");
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<number, PracticeStatus>>({});
  const [visualQuery, setVisualQuery] = useState("");
  const [visualError, setVisualError] = useState<string | null>(null);
  const [summaryQuery, setSummaryQuery] = useState("");
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [stepPhotoNotes, setStepPhotoNotes] = useState<StepPhotoNote[]>([]);
  const [myNotes, setMyNotes] = useState<SavedNote[]>([]);

  useEffect(() => {
    const savedStyle = window.localStorage.getItem(STYLE_STORAGE_KEY);
    if (!savedStyle) {
      return;
    }

    const isValid = learningStyleOptions.some((option) => option.key === savedStyle);
    if (isValid) {
      setSelectedStyle(savedStyle as LearningStyle);
    }
  }, []);

  useEffect(() => {
    if (!selectedStyle) {
      return;
    }

    window.localStorage.setItem(STYLE_STORAGE_KEY, selectedStyle);
  }, [selectedStyle]);

  useEffect(() => {
    const savedNotes = window.localStorage.getItem(MY_NOTES_STORAGE_KEY);
    if (!savedNotes) {
      return;
    }

    try {
      setMyNotes(JSON.parse(savedNotes) as SavedNote[]);
    } catch {
      setMyNotes([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MY_NOTES_STORAGE_KEY, JSON.stringify(myNotes));
  }, [myNotes]);

  useEffect(() => {
    return () => {
      stepPhotoNotes.forEach((item) => URL.revokeObjectURL(item.src));
    };
  }, [stepPhotoNotes]);

  const subjects = useMemo(() => Object.keys(content), []);

  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [selectedSubject, subjects]);

  const topics = useMemo(() => {
    if (!selectedSubject) {
      return [] as string[];
    }

    const subjectTopics = Object.keys(content[selectedSubject]);
    if (selectedStyle !== "step-by-step") {
      return subjectTopics;
    }

    return subjectTopics.filter((topic) => !STEP_BY_STEP_EXCLUDED_TOPICS.has(topic));
  }, [selectedStyle, selectedSubject]);

  useEffect(() => {
    if (topics.length === 0) {
      setSelectedTopic(null);
      return;
    }

    if (!selectedTopic || !topics.includes(selectedTopic)) {
      setSelectedTopic(topics[0]);
    }
  }, [selectedTopic, topics]);

  useEffect(() => {
    setPracticeAnswers({});
    setPracticeResults({});
    setVisualError(null);
    setSummaryError(null);
    setStepPhotoNotes((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.src));
      return [];
    });
  }, [selectedStyle, selectedSubject, selectedTopic]);

  const activeLesson =
    selectedStyle && selectedSubject && selectedTopic
      ? content[selectedSubject]?.[selectedTopic]?.[selectedStyle]
      : null;

  const styleLabel = learningStyleOptions.find((option) => option.key === selectedStyle)?.label;

  function checkPracticeAnswer(questionIndex: number, correctAnswer: string) {
    const studentAnswer = practiceAnswers[questionIndex] ?? "";
    const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(correctAnswer);

    setPracticeResults((prev) => ({
      ...prev,
      [questionIndex]: isCorrect ? "correct" : "incorrect",
    }));
  }

  function handleVisualSearch(event: React.FormEvent) {
    event.preventDefault();

    const trimmedQuery = visualQuery.trim();
    if (!trimmedQuery) {
      setVisualError("Please enter a topic before searching.");
      return;
    }

    setVisualError(null);
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleSummarySearch(event: React.FormEvent) {
    event.preventDefault();

    const trimmedQuery = summaryQuery.trim();
    if (!trimmedQuery) {
      setSummaryError("Please enter a topic before searching.");
      return;
    }

    setSummaryError(null);
    const url = `https://gemini.google.com/app?q=${encodeURIComponent(trimmedQuery)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleStepPhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const newItems: StepPhotoNote[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      src: URL.createObjectURL(file),
      fileName: file.name,
      linkedStep: 0,
      note: "",
      brightness: 100,
      contrast: 100,
    }));

    setStepPhotoNotes((prev) => prev.concat(newItems));
    event.target.value = "";
  }

  function updateStepPhotoNote(id: string, updates: Partial<StepPhotoNote>) {
    setStepPhotoNotes((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  function removeStepPhotoNote(id: string) {
    setStepPhotoNotes((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.src);
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function buildCurrentOutputContent() {
    if (!selectedStyle || !selectedSubject || !selectedTopic || !activeLesson) {
      return null;
    }

    if (selectedStyle === "visual" && "keyPoints" in activeLesson) {
      return [
        `Visual resource: ${activeLesson.visualAid}`,
        "",
        ...activeLesson.keyPoints.map((point, index) => `${index + 1}. ${point}`),
      ].join("\n");
    }

    if (selectedStyle === "step-by-step" && "steps" in activeLesson) {
      const stepNotes = stepPhotoNotes
        .map((item) => `Step ${item.linkedStep + 1}: ${item.fileName}${item.note ? ` - ${item.note}` : ""}`)
        .join("\n");

      return [
        ...activeLesson.steps.map((step, index) => `${index + 1}. ${step}`),
        "",
        "Media Notes:",
        stepNotes || "No media notes added yet.",
      ].join("\n");
    }

    if (selectedStyle === "practice" && "questions" in activeLesson) {
      return activeLesson.questions
        .map((question, index) => {
          const studentAnswer = practiceAnswers[index] ?? "";
          const outcome = practiceResults[index] ?? "not checked";
          return `${index + 1}. ${question.prompt}\nYour answer: ${studentAnswer || "(blank)"}\nExpected: ${question.answer}\nStatus: ${outcome}`;
        })
        .join("\n\n");
    }

    if (selectedStyle === "summary" && "bulletPoints" in activeLesson) {
      return [activeLesson.overview, "", ...activeLesson.bulletPoints.map((point, index) => `${index + 1}. ${point}`)].join(
        "\n"
      );
    }

    return activeLesson.overview;
  }

  function saveCurrentOutputToMyNotes() {
    if (!selectedStyle || !selectedSubject || !selectedTopic) {
      return;
    }

    const outputContent = buildCurrentOutputContent();
    if (!outputContent) {
      return;
    }

    const note: SavedNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${selectedTopic} (${learningStyleOptions.find((option) => option.key === selectedStyle)?.label})`,
      style: selectedStyle,
      subject: selectedSubject,
      topic: selectedTopic,
      content: outputContent,
      createdAt: Date.now(),
    };

    setMyNotes((prev) => [note, ...prev]);
  }

  function removeMyNote(noteId: string) {
    setMyNotes((prev) => prev.filter((note) => note.id !== noteId));
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLockup />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserRound className="h-4 w-4" />
                {userMode === "guest" ? "Guest" : "Logged In"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setUserMode("guest")}>Guest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUserMode("logged-in")}>Login</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUserMode("guest")}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Learning Style</CardTitle>
                <CardDescription>Choose how you want to study first.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {learningStyleOptions.map((option) => {
                  const isActive = selectedStyle === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`w-full rounded-md border px-3 py-3 text-left transition ${
                        isActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
                      }`}
                      onClick={() => setSelectedStyle(option.key)}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {selectedStyle && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Subject & Topic</CardTitle>
                  <CardDescription>Navigate by subject and topic.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Subject</p>
                    <div className="grid gap-2">
                      {subjects.map((subject) => (
                        <Button
                          key={subject}
                          variant={selectedSubject === subject ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => {
                            setSelectedSubject(subject);
                            const nextTopics = Object.keys(content[subject]);
                            const filteredTopics =
                              selectedStyle === "step-by-step"
                                ? nextTopics.filter((topic) => !STEP_BY_STEP_EXCLUDED_TOPICS.has(topic))
                                : nextTopics;
                            setSelectedTopic(filteredTopics[0] ?? null);
                          }}
                        >
                          {subject}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Topics</p>
                    <div className="space-y-1">
                      {topics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setSelectedTopic(topic)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                            selectedTopic === topic
                              ? "bg-primary/10 text-foreground"
                              : "hover:bg-muted/70 text-muted-foreground"
                          }`}
                        >
                          <span className="truncate">{topic}</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          <section>
            <Tabs defaultValue="lesson" className="space-y-4">
              <TabsList>
                <TabsTrigger value="lesson">Lesson</TabsTrigger>
                <TabsTrigger value="my-notes">My Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="lesson">
                {!selectedStyle ? (
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-2xl">Adaptive Study App</CardTitle>
                      <CardDescription>
                        Start by selecting a learning style. Content is rendered from structured data with no AI APIs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-10">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-5 w-5" />
                        <p>Choose Visual, Step by Step by You!, Practice, or Summary to continue.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : !activeLesson ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pick a topic</CardTitle>
                      <CardDescription>Select a subject and topic from the left navigation.</CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-2xl">{selectedTopic}</CardTitle>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {styleLabel}
                        </span>
                      </div>
                      <CardDescription>{activeLesson.overview}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={saveCurrentOutputToMyNotes}>
                          Save Output to My Notes
                        </Button>
                      </div>

                      {selectedStyle === "visual" && "visualAid" in activeLesson && (
                        <div className="space-y-4">
                          <form onSubmit={handleVisualSearch} className="mx-auto flex w-full max-w-xl flex-col gap-2">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={visualQuery}
                                onChange={(event) => setVisualQuery(event.target.value)}
                                placeholder="Search for a topic (e.g., calculus, physics, biology)"
                                aria-label="Visual learning topic"
                                className="h-11"
                              />
                              <Button type="submit" className="h-11 sm:px-6">
                                Search
                              </Button>
                            </div>
                            {visualError && <p className="text-sm text-destructive">{visualError}</p>}
                          </form>

                          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {activeLesson.keyPoints.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedStyle === "step-by-step" && "steps" in activeLesson && (
                        <div className="space-y-4">
                          <div className="rounded-md border border-border/70 p-4">
                            <p className="mb-3 text-sm font-medium">Add media to get started</p>
                            <p className="mb-3 text-sm text-muted-foreground">Send in your notes so we can take a look.</p>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleStepPhotoUpload}
                              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted/60 file:px-3 file:py-1.5"
                            />
                          </div>

                          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
                            {activeLesson.steps.map((step, stepIndex) => (
                              <li key={step}>
                                <p className="font-medium text-foreground">{step}</p>
                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                  {stepPhotoNotes
                                    .filter((item) => item.linkedStep === stepIndex)
                                    .map((item) => (
                                      <div key={item.id} className="rounded-md border border-border/70 bg-muted/20 p-3">
                                        <img
                                          src={item.src}
                                          alt={item.fileName}
                                          className="mb-2 h-40 w-full rounded-md object-cover"
                                          style={{
                                            filter: `brightness(${item.brightness}%) contrast(${item.contrast}%)`,
                                          }}
                                        />
                                        <p className="mb-2 truncate text-xs text-muted-foreground">{item.fileName}</p>

                                        <label className="mb-1 block text-xs font-medium">Attach to Step</label>
                                        <select
                                          value={item.linkedStep}
                                          onChange={(event) =>
                                            updateStepPhotoNote(item.id, {
                                              linkedStep: Number(event.target.value),
                                            })
                                          }
                                          className="mb-2 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                          {activeLesson.steps.map((_, index) => (
                                            <option key={index} value={index}>
                                              Step {index + 1}
                                            </option>
                                          ))}
                                        </select>

                                        <Input
                                          value={item.note}
                                          onChange={(event) =>
                                            updateStepPhotoNote(item.id, {
                                              note: event.target.value,
                                            })
                                          }
                                          placeholder="Edit note for this photo"
                                          className="mb-2"
                                        />

                                        <div className="mb-2 space-y-1">
                                          <label className="block text-xs">Brightness: {item.brightness}%</label>
                                          <input
                                            type="range"
                                            min={50}
                                            max={150}
                                            value={item.brightness}
                                            onChange={(event) =>
                                              updateStepPhotoNote(item.id, {
                                                brightness: Number(event.target.value),
                                              })
                                            }
                                            className="w-full"
                                          />
                                        </div>

                                        <div className="mb-3 space-y-1">
                                          <label className="block text-xs">Contrast: {item.contrast}%</label>
                                          <input
                                            type="range"
                                            min={50}
                                            max={150}
                                            value={item.contrast}
                                            onChange={(event) =>
                                              updateStepPhotoNote(item.id, {
                                                contrast: Number(event.target.value),
                                              })
                                            }
                                            className="w-full"
                                          />
                                        </div>

                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => removeStepPhotoNote(item.id)}
                                        >
                                          Remove Photo
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {selectedStyle === "summary" && "bulletPoints" in activeLesson && (
                        <div className="space-y-4">
                          <form onSubmit={handleSummarySearch} className="mx-auto flex w-full max-w-xl flex-col gap-2">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={summaryQuery}
                                onChange={(event) => setSummaryQuery(event.target.value)}
                                placeholder="Search summary topics in Gemini"
                                aria-label="Summary topic search"
                                className="h-11"
                              />
                              <Button type="submit" className="h-11 sm:px-6">
                                Search Gemini
                              </Button>
                            </div>
                            {summaryError && <p className="text-sm text-destructive">{summaryError}</p>}
                          </form>

                          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                            {activeLesson.bulletPoints.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedStyle === "practice" && "questions" in activeLesson && (
                        <div className="space-y-4">
                          {activeLesson.questions.map((question, index) => {
                            const status = practiceResults[index] ?? null;
                            return (
                              <div key={question.prompt} className="rounded-md border border-border/70 p-4">
                                <p className="mb-2 text-sm font-medium">
                                  {index + 1}. {question.prompt}
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Input
                                    value={practiceAnswers[index] ?? ""}
                                    onChange={(event) =>
                                      setPracticeAnswers((prev) => ({
                                        ...prev,
                                        [index]: event.target.value,
                                      }))
                                    }
                                    placeholder="Type your answer"
                                  />
                                  <Button type="button" onClick={() => checkPracticeAnswer(index, question.answer)}>
                                    Check
                                  </Button>
                                </div>
                                {status === "correct" && (
                                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Correct
                                  </p>
                                )}
                                {status === "incorrect" && (
                                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-destructive">
                                    <XCircle className="h-4 w-4" />
                                    Try again (expected: {question.answer})
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="my-notes">
                <Card>
                  <CardHeader>
                    <CardTitle>My Notes</CardTitle>
                    <CardDescription>Saved outputs from Visual, Step by Step, Practice, and Summary.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No saved notes yet. Save any output from the Lesson tab.
                      </p>
                    ) : (
                      myNotes.map((note) => (
                        <div key={note.id} className="rounded-md border border-border/70 p-3">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{note.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {note.subject} • {note.topic} • {formatSavedDate(note.createdAt)}
                              </p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeMyNote(note.id)}>
                              Remove
                            </Button>
                          </div>
                          <pre className="whitespace-pre-wrap break-words rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                            {note.content}
                          </pre>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </section>
      </div>
    </main>
  );
}
