import type { LibraryItem, StorySceneResponse } from "../../types/story";
import { apiFetch } from "./client";

export async function saveStory(storyId: string): Promise<{ message: string; libraryEntryId: string }> {
  return apiFetch<{ message: string; libraryEntryId: string }>(`/api/library/${storyId}/save`, {
    method: "POST",
  });
}

export async function getLibrary(): Promise<LibraryItem[]> {
  return apiFetch<LibraryItem[]>("/api/library");
}

export async function resumeStory(
  libraryEntryId: string
): Promise<{ storyId: string; currentScene: StorySceneResponse }> {
  return apiFetch<{ storyId: string; currentScene: StorySceneResponse }>(
    `/api/library/${libraryEntryId}/resume`
  );
}

export async function getPreferences(): Promise<{
  defaultChildName?: string;
  defaultChildAge?: number;
}> {
  return apiFetch<{ defaultChildName?: string; defaultChildAge?: number }>("/api/preferences");
}

export async function savePreferences(payload: {
  defaultChildName?: string;
  defaultChildAge?: number;
}): Promise<void> {
  await apiFetch<void>("/api/preferences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
