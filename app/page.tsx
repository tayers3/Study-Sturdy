"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlarmClock, BookOpen, CheckCircle2, ChevronRight, Clock, Pause, Play, RotateCcw, Square, UserRound, XCircle } from "lucide-react";
import { type LearningStyle } from "@/lib/study-content";

type UserMode = "guest" | "logged-in";
type PracticeStatus = "correct" | "incorrect" | null;
type PracticeSource = "gemini" | "custom";

type CustomPracticeQuestion = {
  prompt: string;
  answer: string;
};

type StepPhotoNote = {
  id: string;
  src: string;
  fileName: string;
  linkedStep: number;
  note: string;
  brightness: number;
  contrast: number;
};

type UploadedFileNote = {
  id: string;
  fileName: string;
  fileSize: number;
  note: string;
};

type StepMedia = {
  id: string;
  kind: "image" | "file";
  src: string; // object URL for images, empty string for other files
  fileName: string;
  fileSize: number;
  note: string;
  brightness: number;
  contrast: number;
};

type Step = {
  id: string;
  title: string;
  note: string;
  media: StepMedia[];
};

type SavedNote = {
  id: string;
  title: string;
  style: LearningStyle;
  subject: string;
  topic: string;
  content: string;
  links?: string[];
  createdAt: number;
};

type CustomSubjectsMap = Record<string, string[]>;

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
const CUSTOM_SUBJECTS_STORAGE_KEY = "study-sturdy-custom-subjects-v2";
const LEGACY_CUSTOM_SUBJECTS_STORAGE_KEY = "study-sturdy-custom-subjects";
const VISITED_KEY = "study-sturdy-visited";
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

function getTopicsForSubject(
  subject: string,
  customSubjects: CustomSubjectsMap
) {
  const customTopics = customSubjects[subject] ?? [];
  return Array.from(new Set(customTopics));
}

export default function HomePage() {
  const [userMode, setUserMode] = useState<UserMode>("guest");
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedTopicSubject, setSelectedTopicSubject] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<number, PracticeStatus>>({});
  const [practiceSource, setPracticeSource] = useState<PracticeSource>("custom");
  const [geminiPracticePrompt, setGeminiPracticePrompt] = useState("");
  const [geminiPracticeError, setGeminiPracticeError] = useState<string | null>(null);
  const [customPracticeQuestions, setCustomPracticeQuestions] = useState<CustomPracticeQuestion[]>([
    { prompt: "", answer: "" },
  ]);
  const [visualQuery, setVisualQuery] = useState("");
  const [visualError, setVisualError] = useState<string | null>(null);
  const [lastVisualSearchUrl, setLastVisualSearchUrl] = useState<string | null>(null);
  const [summaryQuery, setSummaryQuery] = useState("");
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [stepPhotoNotes, setStepPhotoNotes] = useState<StepPhotoNote[]>([]);
  const [stepFiles, setStepFiles] = useState<UploadedFileNote[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [userSteps, setUserSteps] = useState<Step[]>(() => {
    const id = `step-${Date.now()}`;
    return [{ id, title: "Step 1", note: "", media: [] }];
  });
  const [practiceFiles, setPracticeFiles] = useState<UploadedFileNote[]>([]);
  const [practiceWorkspaceAnswer, setPracticeWorkspaceAnswer] = useState("");
  const [summaryDraft, setSummaryDraft] = useState("");
  const [drawColor, setDrawColor] = useState<string>("#0f172a");
  const [isDrawing, setIsDrawing] = useState(false);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [myNotes, setMyNotes] = useState<SavedNote[]>([]);
  const [customSubjects, setCustomSubjects] = useState<CustomSubjectsMap>({});
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [styleNoteDraft, setStyleNoteDraft] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditTitle, setNoteEditTitle] = useState("");
  const [noteEditContent, setNoteEditContent] = useState("");
  const [manualNoteTitle, setManualNoteTitle] = useState("");
  const [manualNoteContent, setManualNoteContent] = useState("");

  // Onboarding & splash
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboardingStyle, setShowOnboardingStyle] = useState(false);
  const [showOnboardingClasses, setShowOnboardingClasses] = useState(false);
  const [onboardingNewSubject, setOnboardingNewSubject] = useState("");
  const [onboardingNewTopic, setOnboardingNewTopic] = useState("");
  const [onboardingSelectedSubject, setOnboardingSelectedSubject] = useState<string | null>(null);

  // Timer / alarm
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerMode, setTimerMode] = useState<"stopwatch" | "countdown" | "alarm">("stopwatch");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState("25");
  const [countdownInitial, setCountdownInitial] = useState(25 * 60);
  const [alarmTime, setAlarmTime] = useState("");
  const [alarmFired, setAlarmFired] = useState(false);

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
    window.localStorage.removeItem(LEGACY_CUSTOM_SUBJECTS_STORAGE_KEY);

    const savedCustomSubjects = window.localStorage.getItem(CUSTOM_SUBJECTS_STORAGE_KEY);
    if (!savedCustomSubjects) {
      return;
    }

    try {
      setCustomSubjects(JSON.parse(savedCustomSubjects) as CustomSubjectsMap);
    } catch {
      setCustomSubjects({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_SUBJECTS_STORAGE_KEY, JSON.stringify(customSubjects));
  }, [customSubjects]);

  useEffect(() => {
    return () => {
      stepPhotoNotes.forEach((item) => URL.revokeObjectURL(item.src));
    };
  }, [stepPhotoNotes]);

  // Splash + onboarding on first visit
  useEffect(() => {
    const visited = window.localStorage.getItem(VISITED_KEY);
    if (!visited) {
      setShowSplash(true);
      const t = setTimeout(() => {
        setShowSplash(false);
        setShowOnboardingStyle(true);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // Timer / stopwatch tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      if (timerMode === "stopwatch") {
        setTimerSeconds((s) => s + 1);
      } else if (timerMode === "countdown") {
        setTimerSeconds((s) => {
          if (s <= 1) {
            clearInterval(interval);
            setTimerRunning(false);
            setAlarmFired(true);
            return 0;
          }
          return s - 1;
        });
      } else if (timerMode === "alarm" && alarmTime) {
        const now = new Date();
        const nowStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        if (nowStr === alarmTime) {
          clearInterval(interval);
          setTimerRunning(false);
          setAlarmFired(true);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerMode, alarmTime]);

  const subjects = useMemo(() => {
    return Object.keys(customSubjects);
  }, [customSubjects]);

  const topics = useMemo(() => {
    if (!selectedSubject) {
      return [] as string[];
    }

    return getTopicsForSubject(selectedSubject, customSubjects);
  }, [customSubjects, selectedSubject]);

  useEffect(() => {
    setPracticeAnswers({});
    setPracticeResults({});
    setPracticeSource("custom");
    setGeminiPracticePrompt("");
    setGeminiPracticeError(null);
    setCustomPracticeQuestions([{ prompt: "", answer: "" }]);
    setVisualError(null);
    setLastVisualSearchUrl(null);
    setSummaryError(null);
    setSummaryDraft("");
    setStyleNoteDraft("");
    setSaveMessage(null);
    setStepPhotoNotes((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.src));
      return [];
    });
    // reset steps to a single blank step
    const freshId = `step-${Date.now()}`;
    setUserSteps([{ id: freshId, title: "Step 1", note: "", media: [] }]);
    setActiveStepId(freshId);
  }, [selectedStyle, selectedSubject, selectedTopic]);

  const activePracticeQuestions = useMemo(() => {
    if (selectedStyle !== "practice") {
      return [] as Array<{ prompt: string; answer: string }>;
    }

    if (practiceSource === "custom") {
      return customPracticeQuestions.filter((question) => question.prompt.trim() && question.answer.trim());
    }

    return [] as Array<{ prompt: string; answer: string }>;
  }, [customPracticeQuestions, practiceSource, selectedStyle]);

  const stepOptions = useMemo(() => {
    return ["Step 1", "Step 2", "Step 3"];
  }, []);

  const currentTopicNotes = useMemo(() => {
    if (!selectedTopic || !selectedTopicSubject) {
      return [] as SavedNote[];
    }

    return myNotes.filter(
      (note) => note.topic === selectedTopic && note.subject === selectedTopicSubject
    );
  }, [myNotes, selectedTopic, selectedTopicSubject]);

  const styleLabel = learningStyleOptions.find((option) => option.key === selectedStyle)?.label;

  function checkPracticeAnswer(questionIndex: number, correctAnswer: string) {
    const studentAnswer = practiceAnswers[questionIndex] ?? "";
    const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(correctAnswer);

    setPracticeResults((prev) => ({
      ...prev,
      [questionIndex]: isCorrect ? "correct" : "incorrect",
    }));
  }

  function updateCustomPracticeQuestion(index: number, field: "prompt" | "answer", value: string) {
    setCustomPracticeQuestions((prev) =>
      prev.map((question, i) => (i === index ? { ...question, [field]: value } : question))
    );
  }

  function addCustomPracticeQuestion() {
    setCustomPracticeQuestions((prev) => prev.concat({ prompt: "", answer: "" }));
  }

  function removeCustomPracticeQuestion(index: number) {
    setCustomPracticeQuestions((prev) => {
      if (prev.length <= 1) {
        return [{ prompt: "", answer: "" }];
      }

      return prev.filter((_, i) => i !== index);
    });
  }

  function openGeminiPracticeGenerator(event: React.FormEvent) {
    event.preventDefault();

    const fallbackPrompt = `Generate 8 practice problems with answers for ${selectedTopic ?? "this topic"} in ${selectedTopicSubject ?? selectedSubject ?? "this subject"}.`;
    const prompt = geminiPracticePrompt.trim() || fallbackPrompt;

    if (!prompt.trim()) {
      setGeminiPracticeError("Please enter a prompt before opening Gemini.");
      return;
    }

    setGeminiPracticeError(null);
    const url = `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
    setLastVisualSearchUrl(url);
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

  // ── User Steps (step-by-step mode) ──
  function addStep() {
    const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newStep: Step = { id, title: `Step ${userSteps.length + 1}`, note: "", media: [] };
    setUserSteps((prev) => [...prev, newStep]);
    setActiveStepId(id);
  }

  function removeStep(id: string) {
    setUserSteps((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (updated.length === 0) {
        const fallbackId = `step-${Date.now()}`;
        setActiveStepId(fallbackId);
        return [{ id: fallbackId, title: "Step 1", note: "", media: [] }];
      }
      if (activeStepId === id) {
        setActiveStepId(updated[0].id);
      }
      return updated;
    });
  }

  function updateStepTitle(id: string, title: string) {
    setUserSteps((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }

  function updateStepNote(id: string, note: string) {
    setUserSteps((prev) => prev.map((s) => (s.id === id ? { ...s, note } : s)));
  }

  function moveStep(id: string, direction: "up" | "down") {
    setUserSteps((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const next = direction === "up" ? index - 1 : index + 1;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
  }

  function addStepMedia(stepId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const items: StepMedia[] = Array.from(files).map((file, i) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: `media-${Date.now()}-${i}-${file.name}`,
        kind: isImage ? "image" : "file",
        src: isImage ? URL.createObjectURL(file) : "",
        fileName: file.name,
        fileSize: file.size,
        note: "",
        brightness: 100,
        contrast: 100,
      };
    });
    setUserSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, media: [...s.media, ...items] } : s))
    );
  }

  function updateStepMedia(stepId: string, mediaId: string, updates: Partial<StepMedia>) {
    setUserSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, media: s.media.map((m) => (m.id === mediaId ? { ...m, ...updates } : m)) }
          : s
      )
    );
  }

  function removeStepMedia(stepId: string, mediaId: string) {
    setUserSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const target = s.media.find((m) => m.id === mediaId);
        if (target?.src) URL.revokeObjectURL(target.src);
        return { ...s, media: s.media.filter((m) => m.id !== mediaId) };
      })
    );
  }

  function uploadFileNotes(
    files: FileList | null,
    setter: Dispatch<SetStateAction<UploadedFileNote[]>>
  ) {
    if (!files || files.length === 0) {
      return;
    }

    const items: UploadedFileNote[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      fileName: file.name,
      fileSize: file.size,
      note: "",
    }));

    setter((prev) => prev.concat(items));
  }

  function updateFileNote(
    id: string,
    note: string,
    setter: Dispatch<SetStateAction<UploadedFileNote[]>>
  ) {
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, note } : item)));
  }

  function removeFileNote(id: string, setter: Dispatch<SetStateAction<UploadedFileNote[]>>) {
    setter((prev) => prev.filter((item) => item.id !== id));
  }

  function getCanvasPos(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDraw(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const { x, y } = getCanvasPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawColor === "#facc15" ? 14 : 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }
    const canvas = drawCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const { x, y } = getCanvasPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDraw() {
    setIsDrawing(false);
  }

  function clearDrawingCanvas() {
    const canvas = drawCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function buildCurrentOutputContent() {
    if (!selectedStyle) {
      return null;
    }

    let baseContent = "";

    if (selectedStyle === "visual") {
      baseContent = [
        lastVisualSearchUrl ? `Your searched video: ${lastVisualSearchUrl}` : null,
        visualQuery.trim() ? `Search topic: ${visualQuery.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (selectedStyle === "step-by-step") {
      baseContent = userSteps
        .map((step, i) => {
          const mediaList = step.media
            .map((m) => `  - ${m.fileName}${m.note ? `: ${m.note}` : ""}`)
            .join("\n");
          return `${i + 1}. ${step.title}${step.note ? `\n   ${step.note}` : ""}${mediaList ? `\n${mediaList}` : ""}`;
        })
        .join("\n\n");
    }

    if (selectedStyle === "practice") {
      if (practiceSource === "gemini") {
        const fallbackPrompt = `Generate 8 practice problems with answers for ${selectedTopic ?? "this topic"} in ${selectedSubject ?? "this subject"}.`;
        baseContent = `Practice Source: Gemini\nPrompt: ${geminiPracticePrompt.trim() || fallbackPrompt}`;
      } else {
        const answersContent = activePracticeQuestions
        .map((question, index) => {
          const studentAnswer = practiceAnswers[index] ?? "";
          const outcome = practiceResults[index] ?? "not checked";
          return `${index + 1}. ${question.prompt}\nYour answer: ${studentAnswer || "(blank)"}\nExpected: ${question.answer}\nStatus: ${outcome}`;
        })
        .join("\n\n");

        const fileContent = practiceFiles
          .map((file, index) => `${index + 1}. ${file.fileName}${file.note ? ` - ${file.note}` : ""}`)
          .join("\n");

        baseContent = [
          answersContent || "No practice questions added yet.",
          "",
          `Workspace answer: ${practiceWorkspaceAnswer.trim() || "(blank)"}`,
          "",
          "Files:",
          fileContent || "No files uploaded.",
        ].join("\n");
      }
    }

    if (selectedStyle === "summary") {
      baseContent = [
        summaryQuery.trim() ? `Gemini query: ${summaryQuery.trim()}` : null,
        summaryDraft.trim() ? `Your summary:\n${summaryDraft.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    const trimmedDraft = styleNoteDraft.trim();
    if (trimmedDraft) {
      baseContent = baseContent
        ? `${baseContent}\n\nYour Learning-Style Notes:\n${trimmedDraft}`
        : `Your Learning-Style Notes:\n${trimmedDraft}`;
    }

    return baseContent || null;
  }

  function saveCurrentOutputToMyNotes() {
    if (!selectedStyle) {
      return;
    }

    const outputContent = buildCurrentOutputContent();
    if (!outputContent) {
      setSaveMessage("Add lesson content or write a learning-style note before saving.");
      return;
    }

    const note: SavedNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${selectedTopic ?? "General"} (${learningStyleOptions.find((option) => option.key === selectedStyle)?.label})`,
      style: selectedStyle,
      subject: selectedTopicSubject ?? selectedSubject ?? "General",
      topic: selectedTopic ?? "General",
      content: outputContent,
      links:
        selectedStyle === "visual"
          ? [lastVisualSearchUrl]
              .filter((value): value is string => Boolean(value))
          : undefined,
      createdAt: Date.now(),
    };

    setMyNotes((prev) => [note, ...prev]);
    setSaveMessage("Saved to My Notes.");
  }

  function saveTopicNote() {
    if (!selectedStyle) {
      return;
    }

    const trimmedDraft = styleNoteDraft.trim();
    if (!trimmedDraft) {
      setSaveMessage("Write a note first, then save it to this topic.");
      return;
    }

    const note: SavedNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${selectedTopic ?? "General"} - Topic Note`,
      style: selectedStyle,
      subject: selectedTopicSubject ?? selectedSubject ?? "General",
      topic: selectedTopic ?? "General",
      content: trimmedDraft,
      createdAt: Date.now(),
    };

    setMyNotes((prev) => [note, ...prev]);
    setSaveMessage("Saved note to selected topic.");
  }

  function removeMyNote(noteId: string) {
    setMyNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (openNoteId === noteId) {
      setOpenNoteId(null);
    }
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setNoteEditTitle("");
      setNoteEditContent("");
    }
  }

  function startEditingNote(note: SavedNote) {
    setEditingNoteId(note.id);
    setOpenNoteId(note.id);
    setNoteEditTitle(note.title);
    setNoteEditContent(note.content);
  }

  function cancelEditingNote() {
    setEditingNoteId(null);
    setNoteEditTitle("");
    setNoteEditContent("");
  }

  function saveEditedNote() {
    if (!editingNoteId) {
      return;
    }

    const trimmedTitle = noteEditTitle.trim();
    const trimmedContent = noteEditContent.trim();
    if (!trimmedTitle || !trimmedContent) {
      return;
    }

    setMyNotes((prev) =>
      prev.map((note) =>
        note.id === editingNoteId
          ? {
              ...note,
              title: trimmedTitle,
              content: trimmedContent,
            }
          : note
      )
    );

    cancelEditingNote();
  }

  function addManualNote() {
    const trimmedTitle = manualNoteTitle.trim();
    const trimmedContent = manualNoteContent.trim();
    if (!trimmedTitle || !trimmedContent) {
      return;
    }

    const fallbackStyle: LearningStyle = selectedStyle ?? "summary";

    const note: SavedNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      style: fallbackStyle,
      subject: selectedTopicSubject ?? selectedSubject ?? "General",
      topic: selectedTopic ?? "General",
      content: trimmedContent,
      createdAt: Date.now(),
    };

    setMyNotes((prev) => [note, ...prev]);
    setManualNoteTitle("");
    setManualNoteContent("");
    setOpenNoteId(note.id);
  }

  function addSubject() {
    if (!selectedStyle) {
      return;
    }

    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      return;
    }

    const existingSubject = subjects.find((subject) => subject.toLowerCase() === trimmed.toLowerCase());
    if (existingSubject) {
      setSelectedSubject(existingSubject);
      setNewSubjectName("");
      return;
    }

    setCustomSubjects((prev) => ({
      ...prev,
      [trimmed]: [],
    }));
    setSelectedSubject(trimmed);
    setNewSubjectName("");
  }

  function addTopic() {
    if (!selectedSubject) {
      return;
    }

    const trimmed = newTopicName.trim();
    if (!trimmed) {
      return;
    }

    const currentTopics = getTopicsForSubject(selectedSubject, customSubjects);
    const existingTopic = currentTopics.find((topic) => topic.toLowerCase() === trimmed.toLowerCase());
    if (existingTopic) {
      setNewTopicName("");
      return;
    }

    setCustomSubjects((prev) => ({
      ...prev,
      [selectedSubject]: [...(prev[selectedSubject] ?? []), trimmed],
    }));
    setNewTopicName("");
  }

  // Onboarding handlers
  function handleOnboardingStyleSelect(style: LearningStyle) {
    setSelectedStyle(style);
    setShowOnboardingStyle(false);
    setShowOnboardingClasses(true);
  }

  function addOnboardingSubject() {
    const trimmed = onboardingNewSubject.trim();
    if (!trimmed) return;
    const existing = Object.keys(customSubjects).find((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (!existing) {
      setCustomSubjects((prev) => ({ ...prev, [trimmed]: [] }));
    }
    setOnboardingSelectedSubject(existing ?? trimmed);
    setOnboardingNewSubject("");
  }

  function addOnboardingTopic() {
    if (!onboardingSelectedSubject) return;
    const trimmed = onboardingNewTopic.trim();
    if (!trimmed) return;
    setCustomSubjects((prev) => ({
      ...prev,
      [onboardingSelectedSubject]: [...(prev[onboardingSelectedSubject] ?? []), trimmed],
    }));
    setOnboardingNewTopic("");
  }

  function finishOnboarding() {
    setShowOnboardingClasses(false);
    window.localStorage.setItem(VISITED_KEY, "1");
  }

  // Timer helpers
  function formatTimerDisplay(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function startCountdown() {
    const mins = parseInt(countdownMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    const secs = mins * 60;
    setCountdownInitial(secs);
    setTimerSeconds(secs);
    setAlarmFired(false);
    setTimerRunning(true);
  }

  function resetTimer() {
    setTimerRunning(false);
    setAlarmFired(false);
    if (timerMode === "stopwatch") {
      setTimerSeconds(0);
    } else if (timerMode === "countdown") {
      setTimerSeconds(countdownInitial);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">

      {/* ── Splash screen ── */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
          <BrandLockup className="scale-[2]" />
          <p className="mt-8 animate-pulse text-sm text-muted-foreground">Loading…</p>
        </div>
      )}

      {/* ── Learning-style onboarding modal ── */}
      {showOnboardingStyle && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <BrandLockup className="mb-2" />
              <CardTitle className="text-xl">How do you learn best?</CardTitle>
              <CardDescription>Pick a learning style to personalise your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {learningStyleOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="w-full rounded-md border border-border px-3 py-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
                  onClick={() => handleOnboardingStyleSelect(option.key)}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Classes/topics onboarding modal ── */}
      {showOnboardingClasses && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl">Add your classes &amp; topics</CardTitle>
              <CardDescription>You can add your own subjects and topics now or skip and do it later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Add a Subject / Class</p>
                <div className="flex gap-2">
                  <Input
                    value={onboardingNewSubject}
                    onChange={(e) => setOnboardingNewSubject(e.target.value)}
                    placeholder="e.g., Chemistry"
                    onKeyDown={(e) => e.key === "Enter" && addOnboardingSubject()}
                  />
                  <Button type="button" variant="outline" onClick={addOnboardingSubject}>Add</Button>
                </div>
                {Object.keys(customSubjects).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {Object.keys(customSubjects).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Add a Topic to a Subject</p>
                <div className="flex gap-2">
                  <select
                    value={onboardingSelectedSubject ?? ""}
                    onChange={(e) => setOnboardingSelectedSubject(e.target.value || null)}
                    className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Select subject…</option>
                    {Object.keys(customSubjects).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={onboardingNewTopic}
                    onChange={(e) => setOnboardingNewTopic(e.target.value)}
                    placeholder="e.g., Organic reactions"
                    disabled={!onboardingSelectedSubject}
                    onKeyDown={(e) => e.key === "Enter" && addOnboardingTopic()}
                  />
                  <Button type="button" variant="outline" onClick={addOnboardingTopic} disabled={!onboardingSelectedSubject}>Add</Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={finishOnboarding}>Let's study!</Button>
                <Button variant="ghost" onClick={finishOnboarding}>Skip</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Timer / Alarm modal ── */}
      {showTimerModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Timer &amp; Alarms</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowTimerModal(false); }}>✕</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode tabs */}
              <div className="flex gap-1 rounded-lg border border-border p-1">
                {(["stopwatch", "countdown", "alarm"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setTimerMode(m); setTimerRunning(false); setTimerSeconds(0); setAlarmFired(false); }}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition ${timerMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {alarmFired && (
                <div className="rounded-md bg-primary/10 px-3 py-2 text-center text-sm font-semibold text-primary animate-pulse">
                  ⏰ Time's up!
                </div>
              )}

              {timerMode === "stopwatch" && (
                <div className="space-y-3 text-center">
                  <p className="text-4xl font-mono font-bold">{formatTimerDisplay(timerSeconds)}</p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setTimerRunning((r) => !r)}>
                      {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetTimer}><RotateCcw className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}

              {timerMode === "countdown" && (
                <div className="space-y-3 text-center">
                  <p className="text-4xl font-mono font-bold">{formatTimerDisplay(timerSeconds)}</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={countdownMinutes}
                      onChange={(e) => setCountdownMinutes(e.target.value)}
                      placeholder="Minutes"
                      disabled={timerRunning}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button size="sm" onClick={timerRunning ? () => setTimerRunning(false) : startCountdown}>
                      {timerRunning ? <><Pause className="h-4 w-4 mr-1" />Pause</> : <><Play className="h-4 w-4 mr-1" />Start</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetTimer}><RotateCcw className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}

              {timerMode === "alarm" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Set a time and click Start — you'll get an alert when the clock hits it.</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={alarmTime}
                      onChange={(e) => { setAlarmTime(e.target.value); setAlarmFired(false); }}
                      disabled={timerRunning}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!alarmTime}
                      onClick={() => { setAlarmFired(false); setTimerRunning((r) => !r); }}
                    >
                      {timerRunning ? <><Square className="h-4 w-4 mr-1" />Stop</> : <><AlarmClock className="h-4 w-4 mr-1" />Set Alarm</>}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLockup />
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowTimerModal(true)}>
              <Clock className="h-4 w-4" />
              Timer
            </Button>
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
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How To Use Study Sturdy</CardTitle>
            <CardDescription>Follow these three steps to start studying right away.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>First, choose the learning style that matches how you want to study today.</p>
            <p>Next, add your own subject and topic in the sidebar only if you want to organize your work before saving.</p>
            <p>Then use the lesson tools, save the result to My Notes, and come back to it whenever you need it.</p>
          </CardContent>
        </Card>


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
                      {subjects.length === 0 ? (
                        <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          No subjects yet. Add one below if you want to organize your notes.
                        </p>
                      ) : (
                        subjects.map((subject) => (
                          <Button
                            key={subject}
                            variant={selectedSubject === subject ? "default" : "outline"}
                            className="justify-start"
                            onClick={() => {
                              setSelectedSubject(subject);
                            }}
                          >
                            {subject}
                          </Button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Topics</p>
                    <div className="space-y-1">
                      {topics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => {
                            setSelectedTopic(topic);
                            setSelectedTopicSubject(selectedSubject);
                          }}
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
                      {topics.length === 0 && (
                        <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          {selectedSubject ? "No topics yet. Add one below." : "Select a subject first, then add your own topic."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Add Your Own Subject</p>
                    <div className="flex gap-2">
                      <Input
                        value={newSubjectName}
                        onChange={(event) => setNewSubjectName(event.target.value)}
                        placeholder="e.g., Chemistry"
                      />
                      <Button type="button" variant="outline" onClick={addSubject}>
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Add Your Own Class / Topic</p>
                    <div className="flex gap-2">
                      <Input
                        value={newTopicName}
                        onChange={(event) => setNewTopicName(event.target.value)}
                        placeholder="e.g., Organic reactions"
                        disabled={!selectedSubject}
                      />
                      <Button type="button" variant="outline" onClick={addTopic} disabled={!selectedSubject}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!selectedStyle && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Subject & Topic</CardTitle>
                  <CardDescription>
                    Pick a learning style first to unlock subject and topic selection.
                  </CardDescription>
                </CardHeader>
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
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-2xl">{styleLabel ?? "Learning Style"}</CardTitle>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {selectedTopic ?? "General"}
                        </span>
                      </div>
                      <CardDescription>
                        Use this workspace to learn your way. Subject/topic are optional and only used for organizing notes.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={saveCurrentOutputToMyNotes}>
                          Save Output to My Notes
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Save uses your selected subject/topic when chosen. If none are selected, it saves under General.
                      </p>
                      {saveMessage && <p className="text-sm text-muted-foreground">{saveMessage}</p>}

                      {selectedStyle === "visual" && (
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
                          <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                            Search opens in YouTube and the last searched link is included when you click Save Output to My Notes.
                            It can be saved with your current subject/topic or under General if you leave them blank.
                          </div>
                        </div>
                      )}

                      {selectedStyle === "step-by-step" && (
                        <div className="space-y-4">
                          {/* ── Step tab bar ── */}
                          <div className="flex flex-wrap items-center gap-2">
                            {userSteps.map((step, index) => (
                              <button
                                key={step.id}
                                type="button"
                                onClick={() => setActiveStepId(step.id)}
                                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                                  activeStepId === step.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/60 text-muted-foreground"
                                }`}
                              >
                                {step.title || `Step ${index + 1}`}
                              </button>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addStep}
                            >
                              + Add Step
                            </Button>
                          </div>

                          {/* ── Active step panel ── */}
                          {userSteps.map((step, index) => {
                            if (step.id !== activeStepId) return null;
                            return (
                              <div key={step.id} className="space-y-4 rounded-md border border-border/70 p-4">
                                {/* Title + reorder + delete */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Input
                                    value={step.title}
                                    onChange={(e) => updateStepTitle(step.id, e.target.value)}
                                    placeholder={`Step ${index + 1}`}
                                    className="h-8 flex-1 text-sm font-medium"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={index === 0}
                                    onClick={() => moveStep(step.id, "up")}
                                    title="Move step up"
                                  >
                                    ↑
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={index === userSteps.length - 1}
                                    onClick={() => moveStep(step.id, "down")}
                                    title="Move step down"
                                  >
                                    ↓
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => removeStep(step.id)}
                                    title="Delete step"
                                  >
                                    ✕
                                  </Button>
                                </div>

                                {/* Step note */}
                                <Textarea
                                  value={step.note}
                                  onChange={(e) => updateStepNote(step.id, e.target.value)}
                                  placeholder="Describe this step or add notes..."
                                  rows={3}
                                />

                                {/* Media upload for this step */}
                                <div>
                                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Add photos / files to this step</p>
                                  <input
                                    type="file"
                                    multiple
                                    onChange={(e) => addStepMedia(step.id, e.target.files)}
                                    className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted/60 file:px-3 file:py-1.5"
                                  />
                                </div>

                                {/* Uploaded media cards */}
                                {step.media.length > 0 && (
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {step.media.map((m) => (
                                      <div key={m.id} className="rounded-md border border-border/60 bg-muted/20 p-3">
                                        {m.kind === "image" ? (
                                          <img
                                            src={m.src}
                                            alt={m.fileName}
                                            className="mb-2 h-36 w-full rounded-md object-cover"
                                            style={{ filter: `brightness(${m.brightness}%) contrast(${m.contrast}%)` }}
                                          />
                                        ) : (
                                          <div className="mb-2 flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
                                            <span className="text-lg">📄</span>
                                            <span className="truncate text-xs font-medium">{m.fileName}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">{Math.ceil(m.fileSize / 1024)} KB</span>
                                          </div>
                                        )}

                                        <p className="mb-2 truncate text-xs text-muted-foreground">{m.fileName}</p>

                                        <Input
                                          value={m.note}
                                          onChange={(e) => updateStepMedia(step.id, m.id, { note: e.target.value })}
                                          placeholder="Add a note for this file"
                                          className="mb-2"
                                        />

                                        {m.kind === "image" && (
                                          <div className="mb-2 space-y-1">
                                            <label className="block text-xs">Brightness: {m.brightness}%</label>
                                            <input
                                              type="range" min={50} max={150} value={m.brightness}
                                              onChange={(e) => updateStepMedia(step.id, m.id, { brightness: Number(e.target.value) })}
                                              className="w-full"
                                            />
                                            <label className="block text-xs">Contrast: {m.contrast}%</label>
                                            <input
                                              type="range" min={50} max={150} value={m.contrast}
                                              onChange={(e) => updateStepMedia(step.id, m.id, { contrast: Number(e.target.value) })}
                                              className="w-full"
                                            />
                                          </div>
                                        )}

                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="w-full"
                                          onClick={() => removeStepMedia(step.id, m.id)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Draw workspace */}
                                <div>
                                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Highlight &amp; Draw Workspace</p>
                                  <div className="mb-2 flex flex-wrap gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={() => setDrawColor("#0f172a")}>Pen</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => setDrawColor("#facc15")}>Highlighter</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={clearDrawingCanvas}>Clear</Button>
                                  </div>
                                  <canvas
                                    ref={drawCanvasRef}
                                    width={900}
                                    height={260}
                                    onMouseDown={startDraw}
                                    onMouseMove={draw}
                                    onMouseUp={stopDraw}
                                    onMouseLeave={stopDraw}
                                    className="w-full rounded-md border border-border/70 bg-white"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedStyle === "summary" && (
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
                          <Textarea
                            value={summaryDraft}
                            onChange={(event) => setSummaryDraft(event.target.value)}
                            placeholder="Write your own summary or paste key solve steps here..."
                            rows={6}
                          />
                        </div>
                      )}

                      {selectedStyle === "practice" && (
                        <div className="space-y-4">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Button
                              type="button"
                              variant={practiceSource === "gemini" ? "default" : "outline"}
                              onClick={() => {
                                setPracticeSource("gemini");
                                setPracticeAnswers({});
                                setPracticeResults({});
                              }}
                            >
                              Generate with Gemini
                            </Button>
                            <Button
                              type="button"
                              variant={practiceSource === "custom" ? "default" : "outline"}
                              onClick={() => {
                                setPracticeSource("custom");
                                setPracticeAnswers({});
                                setPracticeResults({});
                              }}
                            >
                              Write Your Own
                            </Button>
                          </div>

                          {practiceSource === "gemini" && (
                            <form onSubmit={openGeminiPracticeGenerator} className="space-y-2 rounded-md border border-border/70 p-4">
                              <p className="text-sm font-medium">Open Gemini to generate practice problems</p>
                              <Input
                                value={geminiPracticePrompt}
                                onChange={(event) => setGeminiPracticePrompt(event.target.value)}
                                placeholder="Optional prompt (or leave blank to use selected subject/topic)"
                              />
                              <Button type="submit">Open Gemini</Button>
                              {geminiPracticeError && <p className="text-sm text-destructive">{geminiPracticeError}</p>}
                            </form>
                          )}

                          {practiceSource === "custom" && (
                            <div className="space-y-3 rounded-md border border-border/70 p-4">
                              <p className="text-sm font-medium">Create your own practice problems</p>
                              {customPracticeQuestions.map((question, index) => (
                                <div key={index} className="space-y-2 rounded-md border border-border/60 p-3">
                                  <Input
                                    value={question.prompt}
                                    onChange={(event) =>
                                      updateCustomPracticeQuestion(index, "prompt", event.target.value)
                                    }
                                    placeholder={`Question ${index + 1}`}
                                  />
                                  <Input
                                    value={question.answer}
                                    onChange={(event) =>
                                      updateCustomPracticeQuestion(index, "answer", event.target.value)
                                    }
                                    placeholder="Expected answer"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => removeCustomPracticeQuestion(index)}
                                  >
                                    Remove Question
                                  </Button>
                                </div>
                              ))}
                              <Button type="button" variant="outline" onClick={addCustomPracticeQuestion}>
                                Add Another Question
                              </Button>
                            </div>
                          )}

                          {practiceSource !== "gemini" &&
                            activePracticeQuestions.map((question, index) => {
                              const status = practiceResults[index] ?? null;
                              return (
                                <div key={`${question.prompt}-${index}`} className="rounded-md border border-border/70 p-4">
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

                          {practiceSource !== "gemini" && activePracticeQuestions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No practice questions available. Choose another source or add your own questions.
                            </p>
                          )}

                          <div className="space-y-3 rounded-md border border-border/70 p-4">
                            <p className="text-sm font-medium">Practice Workspace</p>
                            <Textarea
                              value={practiceWorkspaceAnswer}
                              onChange={(event) => setPracticeWorkspaceAnswer(event.target.value)}
                              placeholder="Solve your problem here or paste your workings..."
                              rows={5}
                            />
                            <input
                              type="file"
                              multiple
                              onChange={(event) => uploadFileNotes(event.target.files, setPracticeFiles)}
                              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted/60 file:px-3 file:py-1.5"
                            />
                            <div className="space-y-2">
                              {practiceFiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No files uploaded yet.</p>
                              ) : (
                                practiceFiles.map((file) => (
                                  <div key={file.id} className="rounded-md border border-border/60 p-2">
                                    <p className="text-xs font-medium">{file.fileName}</p>
                                    <Input
                                      value={file.note}
                                      onChange={(event) => updateFileNote(file.id, event.target.value, setPracticeFiles)}
                                      placeholder="Add a note for this file"
                                      className="mt-2"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="mt-2"
                                      onClick={() => removeFileNote(file.id, setPracticeFiles)}
                                    >
                                      Remove File
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 border-t border-border/60 pt-3">
                        <p className="text-sm font-medium">Learning-Style Notes</p>
                        <Textarea
                          value={styleNoteDraft}
                          onChange={(event) => setStyleNoteDraft(event.target.value)}
                          placeholder="Write your own notes for this style, subject, and topic..."
                          rows={5}
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={saveTopicNote}>
                            Save Note to This Topic
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-border/60 pt-3">
                        <p className="text-sm font-medium">Notes for this topic</p>
                        {currentTopicNotes.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {selectedTopic ? "No saved notes for this topic yet." : "Select a topic to view topic-specific notes."}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {currentTopicNotes.map((note) => (
                              <div key={note.id} className="rounded-md border border-border/70 p-3">
                                <div className="mb-1 flex items-start justify-between gap-3">
                                  <p className="text-sm font-medium">{note.title}</p>
                                  <span className="text-xs text-muted-foreground">{formatSavedDate(note.createdAt)}</span>
                                </div>
                                <pre className="whitespace-pre-wrap break-words rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                                  {note.content}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                    <div className="space-y-2 rounded-md border border-border/70 p-3">
                      <p className="text-sm font-medium">Add a Note Manually</p>
                      <Input
                        value={manualNoteTitle}
                        onChange={(event) => setManualNoteTitle(event.target.value)}
                        placeholder="Note title"
                      />
                      <Textarea
                        value={manualNoteContent}
                        onChange={(event) => setManualNoteContent(event.target.value)}
                        placeholder="Type note details here..."
                        rows={4}
                      />
                      <Button type="button" onClick={addManualNote}>
                        Add Note
                      </Button>
                    </div>

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
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenNoteId((prev) => (prev === note.id ? null : note.id))}
                              >
                                {openNoteId === note.id ? "Close" : "Open"}
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeMyNote(note.id)}>
                                Remove
                              </Button>
                            </div>
                          </div>

                          {openNoteId === note.id && (
                            <div className="space-y-2">
                              {editingNoteId === note.id ? (
                                <>
                                  <Input
                                    value={noteEditTitle}
                                    onChange={(event) => setNoteEditTitle(event.target.value)}
                                    placeholder="Edit title"
                                  />
                                  <Textarea
                                    value={noteEditContent}
                                    onChange={(event) => setNoteEditContent(event.target.value)}
                                    rows={8}
                                    placeholder="Edit note content"
                                  />
                                  <div className="flex gap-2">
                                    <Button type="button" onClick={saveEditedNote}>
                                      Save Changes
                                    </Button>
                                    <Button type="button" variant="outline" onClick={cancelEditingNote}>
                                      Cancel
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <pre className="whitespace-pre-wrap break-words rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                                    {note.content}
                                  </pre>
                                  {note.links && note.links.length > 0 && (
                                    <div className="rounded bg-muted/30 p-2">
                                      <p className="mb-1 text-xs font-medium text-muted-foreground">Saved Links</p>
                                      <div className="space-y-1">
                                        {note.links.map((link) => (
                                          <a
                                            key={link}
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block break-all text-xs text-primary underline"
                                          >
                                            {link}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <Button type="button" variant="outline" size="sm" onClick={() => startEditingNote(note)}>
                                    Edit
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
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
