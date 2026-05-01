import type { GenerateStoryResponse, InteractResponse } from "../../types/story";
import { apiFetch } from "./client";

export interface GeneratePayload {
  childName: string;
  childAge: number;
  theme: string;
  mood?: string;
  regenerate?: boolean;
  interactive?: boolean;
}

export async function postGenerate(payload: GeneratePayload): Promise<GenerateStoryResponse> {
  return apiFetch<GenerateStoryResponse>("/api/stories/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function postInteract(storyId: string, choiceId: string): Promise<InteractResponse> {
  return apiFetch<InteractResponse>(`/api/stories/${storyId}/interact`, {
    method: "POST",
    body: JSON.stringify({ choiceId }),
  });
}

export function exportUrl(storyId: string, format: "pdf" | "text" | "images_only"): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return `${base}/api/stories/${storyId}/export?format=${format}`;
}
