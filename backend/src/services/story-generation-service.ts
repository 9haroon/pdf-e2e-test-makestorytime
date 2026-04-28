import { randomUUID } from "crypto";
import { prisma } from "../db/prisma.js";
import { ModerationService } from "./moderation-service.js";
import { GeminiTextService } from "./gemini-text-service.js";
import { GeminiImageService } from "./gemini-image-service.js";
import { ImageStorageService } from "./image-storage-service.js";
import type {
  StoryContentJson,
  StorySceneResponse,
  StoryChoice,
  StorySceneContent,
} from "../models/story-types.js";
import { loadEnv } from "../config/env.js";
import { parseStoryContent, toJsonValue } from "../models/story-content-codec.js";
import { HttpError } from "../api/middleware/error-handler.js";

const env = loadEnv();

export interface GenerateStoryInput {
  sessionId: string;
  childName: string;
  childAge: number;
  theme: string;
  mood?: string;
  regenerate?: boolean;
  interactive?: boolean;
}

const moderation = new ModerationService();
const textService = new GeminiTextService(env);
const imageService = new GeminiImageService(env);
const storageService = new ImageStorageService(env);

export class StoryGenerationService {
  async generate(input: GenerateStoryInput): Promise<{ storyId: string; currentScene: StorySceneResponse }> {
    const blocked = moderation.checkUserPrompt(`${input.theme} ${input.mood ?? ""}`);
    if (blocked) {
      throw new HttpError(400, "unsafe_prompt", blocked);
    }

    await prisma.session.upsert({
      where: { id: input.sessionId },
      update: {},
      create: { id: input.sessionId },
    });

    const draft = await textService.generateStoryDraft({
      childName: input.childName,
      childAge: input.childAge,
      theme: input.theme,
      mood: input.mood,
      interactive: Boolean(input.interactive),
      minDecisionPoints: 2,
    });

    const storyId = randomUUID();
    const sceneDrafts: StorySceneContent[] = [];
    const illustrationRows: Array<{
      id: string;
      sceneIndex: number;
      imageUrl: string;
      descriptionPrompt: string;
    }> = [];

    for (let i = 0; i < draft.scenes.length; i += 1) {
      const scene = draft.scenes[i];
      const generatedBlock = moderation.checkGeneratedText(scene.text);
      if (generatedBlock) {
        throw new HttpError(422, "unsafe_generated_content", generatedBlock);
      }
      const image = await imageService.generateSceneIllustration({
        sceneSummary: scene.text.slice(0, 140),
        childSafe: true,
      });
      const stored = await storageService.saveImage({
        buffer: image.buffer,
        mimeType: image.mimeType,
      });
      const illustrationId = randomUUID();
      sceneDrafts.push({
        text: scene.text,
        illustrationId,
        choices: normalizeChoices(scene.choices, draft.scenes.length),
      });
      illustrationRows.push({
        id: illustrationId,
        sceneIndex: i,
        imageUrl: stored.imageUrl,
        descriptionPrompt: scene.text.slice(0, 200),
      });
    }

    await prisma.story.create({
      data: {
        id: storyId,
        sessionId: input.sessionId,
        title: draft.title,
        childName: input.childName,
        childAge: input.childAge,
        themePrompt: input.theme,
        mood: input.mood,
        status: "in_progress",
        currentSceneIndex: 0,
        storyContent: toJsonValue(sceneDrafts),
      },
    });

    await prisma.illustration.createMany({
      data: illustrationRows.map((row) => ({
        ...row,
        storyId,
      })),
    });

    const currentScene = await this.getCurrentScene(storyId);
    return { storyId, currentScene };
  }

  async getCurrentScene(storyId: string): Promise<StorySceneResponse> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      throw new HttpError(404, "story_not_found", "Story not found.");
    }
    const content = parseStoryContent(story.storyContent);
    const scene = content[story.currentSceneIndex];
    if (!scene) {
      throw new HttpError(500, "invalid_story_state", "Story scene is not available.");
    }
    const illustration = await prisma.illustration.findUnique({ where: { id: scene.illustrationId } });
    return {
      text: scene.text,
      illustrationUrl: illustration?.imageUrl ?? "",
      choices: scene.choices.map((choice) => ({ id: choice.id, text: choice.text })),
    };
  }
}

function normalizeChoices(
  choices: Array<{ text: string; nextSceneIndex: number }>,
  maxLength: number
): StoryChoice[] {
  return choices.map((choice) => ({
    id: randomUUID(),
    text: choice.text,
    nextSceneIndex: clamp(choice.nextSceneIndex, 0, Math.max(0, maxLength - 1)),
  }));
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
