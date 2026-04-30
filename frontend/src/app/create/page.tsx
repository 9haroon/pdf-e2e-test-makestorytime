"use client";

import { FormEvent, useEffect, useState } from "react";
import { postGenerate, postInteract } from "../../lib/api/stories";
import { StoryScene } from "../../components/story/StoryScene";
import { SaveToLibraryButton } from "../../components/story/SaveToLibraryButton";
import { StoryExport } from "../../components/story/StoryExport";
import type { StorySceneResponse } from "../../types/story";
import { getPreferences, savePreferences } from "../../lib/api/library";

const EMPTY_SCENE: StorySceneResponse = {
  text: "Generate a story to begin.",
  illustrationUrl: "",
  choices: [],
};

export default function CreateStoryPage() {
  const [childName, setChildName] = useState("Max");
  const [childAge, setChildAge] = useState<number>(5);
  const [theme, setTheme] = useState("space adventure");
  const [mood, setMood] = useState("cozy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storyId, setStoryId] = useState<string | null>(null);
  const [scene, setScene] = useState<StorySceneResponse>(EMPTY_SCENE);

  useEffect(() => {
    void (async () => {
      try {
        const prefs = await getPreferences();
        if (prefs.defaultChildName) setChildName(prefs.defaultChildName);
        if (typeof prefs.defaultChildAge === "number") setChildAge(prefs.defaultChildAge);
      } catch {
        // Optional
      }
    })();
  }, []);

  async function generate(regenerate: boolean): Promise<void> {
    setLoading(true);
    setError("");
    try {
      await savePreferences({ defaultChildName: childName, defaultChildAge: childAge });
      const res = await postGenerate({ childName, childAge, theme, mood, regenerate, interactive: true });
      setStoryId(res.storyId);
      setScene(res.currentScene);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate story.");
    } finally {
      setLoading(false);
    }
  }

  async function onChoice(choiceId: string): Promise<void> {
    if (!storyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await postInteract(storyId, choiceId);
      setScene(res.currentScene);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue story.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await generate(false);
  }

  return (
    <div className="grid" style={{ gap: "1.2rem" }}>
      <form className="card grid" onSubmit={onSubmit}>
        <h1>Create a personalized bedtime story</h1>
        <div className="field">
          <label htmlFor="childName">Child name</label>
          <input id="childName" className="input" value={childName} onChange={(e) => setChildName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="childAge">Child age</label>
          <input id="childAge" className="input" type="number" min={1} max={18} value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="theme">Theme</label>
          <input id="theme" className="input" value={theme} onChange={(e) => setTheme(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mood">Mood (optional)</label>
          <input id="mood" className="input" value={mood} onChange={(e) => setMood(e.target.value)} />
        </div>
        <div className="row">
          <button className="btn" disabled={loading} type="submit">{loading ? "Generating..." : "Generate story"}</button>
          <button className="btn secondary" disabled={loading} type="button" onClick={() => void generate(true)}>New version</button>
        </div>
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      </form>

      <StoryScene scene={scene} loading={loading} onSelectChoice={(id) => void onChoice(id)} />

      {storyId ? (
        <div className="card grid">
          <SaveToLibraryButton storyId={storyId} />
          <StoryExport storyId={storyId} />
        </div>
      ) : null}
    </div>
  );
}
