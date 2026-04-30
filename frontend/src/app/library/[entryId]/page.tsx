"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { resumeStory } from "../../../lib/api/library";
import { postInteract } from "../../../lib/api/stories";
import { StoryScene } from "../../../components/story/StoryScene";
import type { StorySceneResponse } from "../../../types/story";

const EMPTY: StorySceneResponse = {
  text: "Loading saved story...",
  illustrationUrl: "",
  choices: [],
};

export default function ResumePage() {
  const { entryId } = useParams<{ entryId: string }>();
  const [storyId, setStoryId] = useState<string>("");
  const [scene, setScene] = useState<StorySceneResponse>(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await resumeStory(entryId);
        setStoryId(data.storyId);
        setScene(data.currentScene);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not resume story.");
      }
    })();
  }, [entryId]);

  async function onChoice(choiceId: string): Promise<void> {
    if (!storyId) return;
    setLoading(true);
    try {
      const res = await postInteract(storyId, choiceId);
      setScene(res.currentScene);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue story.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid">
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <StoryScene scene={scene} loading={loading} onSelectChoice={(id) => void onChoice(id)} />
    </section>
  );
}
