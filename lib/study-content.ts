export type LearningStyle = "visual" | "step-by-step" | "practice" | "summary";

export type PracticeQuestion = {
  prompt: string;
  answer: string;
};

export type LessonByStyle = {
  visual: {
    overview: string;
    visualAid: string;
    keyPoints: string[];
  };
  "step-by-step": {
    overview: string;
    steps: string[];
  };
  practice: {
    overview: string;
    questions: PracticeQuestion[];
  };
  summary: {
    overview: string;
    bulletPoints: string[];
  };
};

export const content: Record<string, Record<string, LessonByStyle>> = {
  Mathematics: {
    "Solving Linear Equations": {
      visual: {
        overview: "A linear equation is like a balanced scale. Whatever you do on one side, do on the other.",
        visualAid: "https://www.youtube.com/results?search_query=linear+equations+balance+method",
        keyPoints: [
          "Keep both sides balanced",
          "Undo operations in reverse order",
          "Check your answer by substitution",
        ],
      },
      "step-by-step": {
        overview: "Isolate the variable using inverse operations in a clear order.",
        steps: [
          "Simplify both sides (combine like terms).",
          "Move constant terms away from the variable.",
          "Move variable terms to one side.",
          "Divide or multiply to isolate the variable.",
          "Substitute the value back to verify.",
        ],
      },
      practice: {
        overview: "Solve each equation and enter only the value of x.",
        questions: [
          { prompt: "2x + 3 = 11", answer: "4" },
          { prompt: "x - 5 = 9", answer: "14" },
          { prompt: "3x = 21", answer: "7" },
        ],
      },
      summary: {
        overview: "Linear equations are solved by isolating the unknown variable.",
        bulletPoints: [
          "Use inverse operations to undo terms around x.",
          "Do the same operation to both sides.",
          "Always verify by plugging the answer back in.",
        ],
      },
    },
    "Slope-Intercept Form": {
      visual: {
        overview: "Slope-intercept form is y = mx + b, where m is slope and b is y-intercept.",
        visualAid: "https://www.youtube.com/results?search_query=slope+intercept+form+graphing",
        keyPoints: [
          "m tells steepness and direction",
          "b is where the line crosses the y-axis",
          "Use rise/run to interpret slope",
        ],
      },
      "step-by-step": {
        overview: "Convert equations into y = mx + b to identify slope and intercept quickly.",
        steps: [
          "Start with the original linear equation.",
          "Move x terms and constants to isolate y.",
          "Divide by coefficient of y if needed.",
          "Read m as slope and b as y-intercept.",
        ],
      },
      practice: {
        overview: "Write each equation in y = mx + b and identify m.",
        questions: [
          { prompt: "2y = 4x + 6 (What is m?)", answer: "2" },
          { prompt: "y - 3 = -x (What is m?)", answer: "-1" },
          { prompt: "3y + 6x = 9 (What is m?)", answer: "-2" },
        ],
      },
      summary: {
        overview: "Slope-intercept form helps you graph and compare lines fast.",
        bulletPoints: [
          "Standard form can be rearranged to slope-intercept form.",
          "Positive slope rises left to right; negative slope falls.",
          "The y-intercept is the starting point on the graph.",
        ],
      },
    },
  },
  Biology: {
    Photosynthesis: {
      visual: {
        overview: "Plants convert light energy into chemical energy in glucose.",
        visualAid: "https://www.youtube.com/results?search_query=photosynthesis+diagram+chloroplast",
        keyPoints: [
          "Occurs mainly in chloroplasts",
          "Uses sunlight, water, and carbon dioxide",
          "Produces glucose and oxygen",
        ],
      },
      "step-by-step": {
        overview: "Track how energy moves from sunlight into glucose.",
        steps: [
          "Chlorophyll absorbs sunlight.",
          "Water splits to release electrons and oxygen.",
          "Energy carriers form in light reactions.",
          "Calvin cycle builds glucose from carbon dioxide.",
        ],
      },
      practice: {
        overview: "Answer each prompt with the key term.",
        questions: [
          { prompt: "Organelle where photosynthesis happens", answer: "chloroplast" },
          { prompt: "Gas taken in during photosynthesis", answer: "carbon dioxide" },
          { prompt: "Main sugar produced", answer: "glucose" },
        ],
      },
      summary: {
        overview: "Photosynthesis stores solar energy in glucose.",
        bulletPoints: [
          "Inputs: light, water, carbon dioxide",
          "Outputs: glucose and oxygen",
          "Light reactions and Calvin cycle work together",
        ],
      },
    },
    "Cellular Respiration": {
      visual: {
        overview: "Cells break down glucose to release usable energy (ATP).",
        visualAid: "https://www.youtube.com/results?search_query=cellular+respiration+stages+ATP",
        keyPoints: [
          "Begins with glycolysis",
          "Krebs cycle and electron transport follow",
          "Most ATP is generated in mitochondria",
        ],
      },
      "step-by-step": {
        overview: "Follow glucose as it is converted to ATP through major stages.",
        steps: [
          "Glycolysis splits glucose in cytoplasm.",
          "Pyruvate enters mitochondria.",
          "Krebs cycle releases electrons and carbon dioxide.",
          "Electron transport chain drives ATP production.",
        ],
      },
      practice: {
        overview: "Answer with the correct stage or product.",
        questions: [
          { prompt: "First stage of respiration", answer: "glycolysis" },
          { prompt: "Energy currency molecule", answer: "atp" },
          { prompt: "Main organelle used", answer: "mitochondria" },
        ],
      },
      summary: {
        overview: "Respiration converts glucose energy into ATP for cell work.",
        bulletPoints: [
          "Glycolysis starts energy extraction",
          "Mitochondrial stages maximize ATP yield",
          "Oxygen helps drive efficient ATP production",
        ],
      },
    },
  },
};