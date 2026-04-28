import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { StoryContentJson } from "./story-types.js";

const choiceSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  nextSceneIndex: z.number().int().nonnegative(),
});

const sceneSchema = z.object({
  text: z.string(),
  illustrationId: z.string().uuid(),
  choices: z.array(choiceSchema),
});

const contentSchema = z.array(sceneSchema);

export function parseStoryContent(value: Prisma.JsonValue): StoryContentJson {
  return contentSchema.parse(value);
}

export function toJsonValue(content: StoryContentJson): Prisma.InputJsonValue {
  const jsonArray: Prisma.InputJsonArray = content.map((scene) => ({
    text: scene.text,
    illustrationId: scene.illustrationId,
    choices: scene.choices.map((choice) => ({
      id: choice.id,
      text: choice.text,
      nextSceneIndex: choice.nextSceneIndex,
    })),
  }));
  return jsonArray;
}
