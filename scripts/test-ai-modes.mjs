const baseUrl = process.env.AI_TEST_BASE_URL ?? "http://localhost:3000";

const modes = [
  { mode: "slideshow", requiredKeys: ["slides"] },
  { mode: "audio", requiredKeys: ["audioScript", "audioSections"] },
  { mode: "flashcards", requiredKeys: ["flashcards"] },
  { mode: "mindmap", requiredKeys: ["mindmap"] },
  { mode: "quiz", requiredKeys: ["quizQuestions"] },
  { mode: "summary", requiredKeys: ["summary"] },
];

async function validateMode(modeConfig) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Explain osmosis briefly",
      level: modeConfig.mode,
    }),
  });

  const data = await response.json();
  const payload = data?.message?.response;

  if (!response.ok) {
    throw new Error(`${modeConfig.mode}: expected 200 but got ${response.status} (${data?.error ?? "unknown error"})`);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error(`${modeConfig.mode}: missing response payload`);
  }

  if (payload.mode !== modeConfig.mode) {
    throw new Error(`${modeConfig.mode}: expected mode '${modeConfig.mode}' but got '${payload.mode ?? "undefined"}'`);
  }

  if (typeof payload.answer !== "string" || payload.answer.length === 0) {
    throw new Error(`${modeConfig.mode}: missing non-empty answer`);
  }

  for (const key of modeConfig.requiredKeys) {
    if (!(key in payload) || payload[key] == null) {
      throw new Error(`${modeConfig.mode}: missing required key '${key}'`);
    }
  }
}

async function main() {
  for (const mode of modes) {
    await validateMode(mode);
    console.log(`PASS ${mode.mode}`);
  }

  console.log(`All AI modes validated against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
