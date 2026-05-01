import { prisma } from "../db/prisma.js";
import type { StorySceneResponse } from "../models/story-types.js";
import { parseStoryContent } from "../models/story-content-codec.js";
import { HttpError } from "../api/middleware/error-handler.js";

export class StoryInteractionService {
  async advance(storyId: string, choiceId: string): Promise<{ currentScene: StorySceneResponse; isCompleted: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      throw new HttpError(404, "story_not_found", "Story not found.");
    }

    const content = parseStoryContent(story.storyContent);
    const current = content[story.currentSceneIndex];
    if (!current) {
      throw new HttpError(500, "invalid_story_state", "Current story scene is missing.");
    }

    const choice = current.choices.find((item) => item.id === choiceId);
    if (!choice) {
      throw new HttpError(400, "invalid_choice", "That choice is not available right now.");
    }

    const nextIndex = choice.nextSceneIndex;
    const nextScene = content[nextIndex];
    if (!nextScene) {
      throw new HttpError(500, "invalid_choice_target", "The selected choice could not continue the story.");
    }

    const updated = await prisma.story.update({
      where: { id: storyId },
      data: {
        currentSceneIndex: nextIndex,
        status: nextScene.choices.length === 0 ? "completed" : "in_progress",
      },
    });

    const illustration = await prisma.illustration.findUnique({ where: { id: nextScene.illustrationId } });
    return {
      currentScene: {
        text: nextScene.text,
        illustrationUrl: illustration?.imageUrl ?? "",
        choices: nextScene.choices.map((item) => ({ id: item.id, text: item.text })),
      },
      isCompleted: updated.status === "completed",
    };
  }
}
