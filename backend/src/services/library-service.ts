import { prisma } from "../db/prisma.js";
import type { StorySceneResponse } from "../models/story-types.js";
import { parseStoryContent } from "../models/story-content-codec.js";
import { HttpError } from "../api/middleware/error-handler.js";

export class LibraryService {
  async saveStory(sessionId: string, storyId: string): Promise<{ libraryEntryId: string }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      throw new HttpError(404, "story_not_found", "Story not found.");
    }

    await prisma.session.upsert({
      where: { id: sessionId },
      update: {},
      create: { id: sessionId },
    });

    const entry = await prisma.libraryEntry.upsert({
      where: {
        sessionId_storyId: {
          sessionId,
          storyId,
        },
      },
      update: {
        lastReadSceneIndex: story.currentSceneIndex,
      },
      create: {
        sessionId,
        storyId,
        lastReadSceneIndex: story.currentSceneIndex,
      },
    });

    return { libraryEntryId: entry.id };
  }

  async list(sessionId: string): Promise<Array<{ libraryEntryId: string; storyId: string; title: string; lastReadSceneIndex: number; childName: string }>> {
    const entries = await prisma.libraryEntry.findMany({
      where: { sessionId },
      include: { story: true },
      orderBy: { addedAt: "desc" },
    });
    return entries.map((entry) => ({
      libraryEntryId: entry.id,
      storyId: entry.storyId,
      title: entry.story.title,
      childName: entry.story.childName,
      lastReadSceneIndex: entry.lastReadSceneIndex,
    }));
  }

  async resume(sessionId: string, libraryEntryId: string): Promise<{ storyId: string; currentScene: StorySceneResponse }> {
    const entry = await prisma.libraryEntry.findFirst({
      where: { id: libraryEntryId, sessionId },
      include: { story: true },
    });
    if (!entry) {
      throw new HttpError(404, "library_entry_not_found", "Saved story entry not found.");
    }

    const content = parseStoryContent(entry.story.storyContent);
    const scene = content[entry.lastReadSceneIndex] ?? content[0];
    if (!scene) {
      throw new HttpError(500, "invalid_story_state", "Saved story has no scenes.");
    }
    const illustration = await prisma.illustration.findUnique({ where: { id: scene.illustrationId } });
    return {
      storyId: entry.storyId,
      currentScene: {
        text: scene.text,
        illustrationUrl: illustration?.imageUrl ?? "",
        choices: scene.choices.map((choice) => ({ id: choice.id, text: choice.text })),
      },
    };
  }

  async savePreferences(sessionId: string, payload: { defaultChildName?: string; defaultChildAge?: number }): Promise<void> {
    await prisma.session.upsert({
      where: { id: sessionId },
      update: {},
      create: { id: sessionId },
    });

    await prisma.userPreference.upsert({
      where: { sessionId },
      update: {
        defaultChildName: payload.defaultChildName,
        defaultChildAge: payload.defaultChildAge,
      },
      create: {
        sessionId,
        defaultChildName: payload.defaultChildName,
        defaultChildAge: payload.defaultChildAge,
      },
    });
  }

  async getPreferences(sessionId: string): Promise<{ defaultChildName?: string; defaultChildAge?: number }> {
    const prefs = await prisma.userPreference.findUnique({ where: { sessionId } });
    return {
      defaultChildName: prefs?.defaultChildName ?? undefined,
      defaultChildAge: prefs?.defaultChildAge ?? undefined,
    };
  }
}
