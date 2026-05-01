import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Env } from "../config/env.js";

export interface GeneratedSceneDraft {
  text: string;
  choices: Array<{ text: string; nextSceneIndex: number }>;
}

export interface GeneratedStoryDraft {
  title: string;
  scenes: GeneratedSceneDraft[];
}

const jsonStoryInstruction = (
  interactive: boolean,
  minDecisionPoints: number
) => `You write short, warm bedtime stories for young children.

Output **only valid JSON** (no markdown fences) with this shape:
{
  "title": "string",
  "scenes": [
    {
      "text": "string (2-5 short paragraphs, gentle tone)",
      "choices": [
        { "text": "string", "nextSceneIndex": 0 }
      ]
    }
  ]
}

Rules:
- All content must be child-safe: no violence, fear, romance, politics, or adult themes.
- Language should match the child's age supplied in the user prompt.
${interactive ? `- Include at least ${minDecisionPoints} scenes that each offer **at least two** distinct, positive choices.\n- Every choice "nextSceneIndex" must refer to a valid scene index in the scenes array.\n- The story must include at least **${minDecisionPoints}** decision moments (branching scenes) overall.` : "- Use exactly **one** scene with an empty choices array []."}

Scenes array must have at least 1 entry.`;

/**
 * Calls Gemini when `GEMINI_API_KEY` is set; otherwise returns a deterministic mock for local dev.
 */
export class GeminiTextService {
  constructor(private readonly env: Env) {}

  async generateStoryDraft(params: {
    childName: string;
    childAge: number;
    theme: string;
    mood?: string;
    /** When false, produces a single-scene story (MVP opening). */
    interactive: boolean;
    /** Minimum branching decision points when interactive (FR-003). */
    minDecisionPoints: number;
  }): Promise<GeneratedStoryDraft> {
    const prompt = jsonStoryInstruction(params.interactive, params.minDecisionPoints)
      .replace("{{age}}", String(params.childAge));

    const userBlob = [
      `Child name: ${params.childName}`,
      `Age: ${params.childAge}`,
      `Theme: ${params.theme}`,
      params.mood ? `Mood: ${params.mood}` : "",
      prompt,
    ]
      .filter(Boolean)
      .join("\n");

    if (!this.env.GEMINI_API_KEY) {
      return this.mockDraft(params);
    }

    const genAI = new GoogleGenerativeAI(this.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: this.env.GEMINI_TEXT_MODEL });
    const result = await model.generateContent(userBlob);
    const raw = result.response.text();
    return parseStoryJson(raw, params);
  }

  private mockDraft(params: {
    childName: string;
    childAge: number;
    theme: string;
    interactive: boolean;
    minDecisionPoints: number;
  }): GeneratedStoryDraft {
    if (!params.interactive) {
      return {
        title: `${params.childName}'s ${params.theme} adventure`,
        scenes: [
          {
            text: `Once upon a time, ${params.childName}, who was ${params.childAge} years old, dreamed of a gentle ${params.theme} world. Stars blinked softly as a friendly glow guided them down a mossy path. Birds hummed a lullaby, and the air smelled like cookies and kindness. ${params.childName} took a deep breath and smiled, knowing the night was full of cozy surprises. The End... for tonight.`,
            choices: [],
          },
        ],
      };
    }

    return {
      title: `${params.childName}'s branching ${params.theme} tale`,
      scenes: [
        {
          text: `${params.childName} opened a sparkling story book. Page one glowed: two happy paths appeared through a friendly forest.`,
          choices: [
            { text: "Follow the firefly lane", nextSceneIndex: 1 },
            { text: "Visit the sleepy river", nextSceneIndex: 2 },
          ],
        },
        {
          text: `Fireflies danced ahead, lighting soft stepping stones. ${params.childName} giggled as petals tickled their toes.`,
          choices: [
            { text: "Sing with the crickets", nextSceneIndex: 3 },
            { text: "Share berries with a bunny", nextSceneIndex: 3 },
          ],
        },
        {
          text: `The river hummed a cuddly song. Waves rocked a leaf boat while otters waved tiny paws.`,
          choices: [
            { text: "Float toward the moon mirror", nextSceneIndex: 3 },
            { text: "Wish on a lily pad", nextSceneIndex: 3 },
          ],
        },
        {
          text: `${params.childName} curled up as the story tucked them in. Sweet dreams drifted by on cotton-candy clouds. Good night, little hero.`,
          choices: [],
        },
      ],
    };
  }
}

function parseStoryJson(
  raw: string,
  params: { interactive: boolean; minDecisionPoints: number }
): GeneratedStoryDraft {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned) as unknown;
  } catch {
    throw new Error("Model did not return valid JSON for the story.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model JSON root must be an object.");
  }
  const obj = parsed as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title : "Untitled story";
  const scenesRaw = obj.scenes;
  if (!Array.isArray(scenesRaw) || scenesRaw.length === 0) {
    throw new Error("Model JSON must include a non-empty scenes array.");
  }
  const scenes: GeneratedSceneDraft[] = scenesRaw.map((s, idx) => {
    if (!s || typeof s !== "object") {
      throw new Error(`Invalid scene at index ${idx}`);
    }
    const rec = s as Record<string, unknown>;
    const text = typeof rec.text === "string" ? rec.text : "";
    const choicesRaw = rec.choices;
    const choices: Array<{ text: string; nextSceneIndex: number }> = [];
    if (Array.isArray(choicesRaw)) {
      for (const c of choicesRaw) {
        if (c && typeof c === "object") {
          const cr = c as Record<string, unknown>;
          const ct = typeof cr.text === "string" ? cr.text : "";
          const ni =
            typeof cr.nextSceneIndex === "number" && Number.isFinite(cr.nextSceneIndex)
              ? cr.nextSceneIndex
              : 0;
          choices.push({ text: ct, nextSceneIndex: ni });
        }
      }
    }
    return { text, choices };
  });

  const draft: GeneratedStoryDraft = { title, scenes };

  if (!params.interactive && draft.scenes.length !== 1) {
    draft.scenes = [draft.scenes[0]];
    draft.scenes[0].choices = [];
  }

  return draft;
}
