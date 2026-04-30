"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StoryScene } from "../../../components/story/StoryScene";
import type { StorySceneResponse } from "../../../types/story";
import { postInteract } from "../../../lib/api/stories";

const EMPTY: StorySceneResponse = {
  text: "Open a story from the Create screen or Library.",
  illustrationUrl: "",
  choices: [],
};

export default function StoryPage() {
  const params = useParams<{ storyId: string }>();
  const storyId = params.storyId;
  const [scene, setScene] = useState<StorySceneResponse>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This page expects navigation from create/library with active scene in memory.
  }, [storyId]);

  async function onChoice(choiceId: string): Promise<void> {
    setLoading(true);
    try {
      const res = await postInteract(storyId, choiceId);
      setScene(res.currentScene);
    } finally {
      setLoading(false);
    }
  }

  return <StoryScene scene={scene} loading={loading} onSelectChoice={(id) => void onChoice(id)} />;
}
