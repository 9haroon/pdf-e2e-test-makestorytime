export interface StoryChoiceResponse {
  id: string;
  text: string;
}

export interface StorySceneResponse {
  text: string;
  illustrationUrl: string;
  choices: StoryChoiceResponse[];
}

export interface GenerateStoryResponse {
  storyId: string;
  currentScene: StorySceneResponse;
}

export interface InteractResponse {
  currentScene: StorySceneResponse;
  isCompleted: boolean;
}

export interface LibraryItem {
  libraryEntryId: string;
  storyId: string;
  title: string;
  childName: string;
  lastReadSceneIndex: number;
}
