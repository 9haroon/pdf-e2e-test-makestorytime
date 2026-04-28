/**
 * Serialized shape stored in `Story.storyContent` (JSON column).
 * Each scene references an illustration row by stable id.
 */

export interface StoryChoice {
  id: string;
  text: string;
  /** Index into the `storyContent` array that this choice leads to */
  nextSceneIndex: number;
}

export interface StorySceneContent {
  text: string;
  illustrationId: string;
  choices: StoryChoice[];
}

export type StoryContentJson = StorySceneContent[];

/** API-facing scene payload (no internal illustration uuid exposure where avoidable) */
export interface StorySceneResponse {
  text: string;
  illustrationUrl: string;
  choices: Array<{ id: string; text: string }>;
}
