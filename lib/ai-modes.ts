export const canonicalAiModes = [
  "slideshow",
  "audio",
  "flashcards",
  "mindmap",
  "quiz",
  "summary",
] as const;

export const legacyAiModes = ["visual_learner", "flash_cards", "note_taker"] as const;

export const allAiModes = [...canonicalAiModes, ...legacyAiModes] as const;

export type CanonicalAiMode = (typeof canonicalAiModes)[number];
export type LegacyAiMode = (typeof legacyAiModes)[number];
export type AiMode = (typeof allAiModes)[number];

const aiModeAliases: Record<LegacyAiMode, CanonicalAiMode> = {
  visual_learner: "slideshow",
  flash_cards: "flashcards",
  note_taker: "summary",
};

const aiModeLabels: Record<CanonicalAiMode, string> = {
  slideshow: "Slideshow",
  audio: "Audio",
  flashcards: "Flashcards",
  mindmap: "Mind Map",
  quiz: "Quiz",
  summary: "Summary",
};

export function normalizeAiMode(mode?: string | null): CanonicalAiMode {
  if (!mode) {
    return "summary";
  }

  if ((canonicalAiModes as readonly string[]).includes(mode)) {
    return mode as CanonicalAiMode;
  }

  if ((legacyAiModes as readonly string[]).includes(mode)) {
    return aiModeAliases[mode as LegacyAiMode];
  }

  return "summary";
}

export function getAiModeLabel(mode?: string | null): string {
  return aiModeLabels[normalizeAiMode(mode)];
}
