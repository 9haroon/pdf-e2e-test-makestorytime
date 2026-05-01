"use client";

import Image from "next/image";
import type { StorySceneResponse } from "../../types/story";
import { StoryChoices } from "./StoryChoices";

interface StorySceneProps {
  scene: StorySceneResponse;
  loading?: boolean;
  onSelectChoice?: (choiceId: string) => void;
}

export function StoryScene({ scene, loading, onSelectChoice }: StorySceneProps) {
  return (
    <section className="card grid" aria-live="polite">
      <h2>Current scene</h2>
      {scene.illustrationUrl ? (
        <Image
          src={scene.illustrationUrl}
          width={512}
          height={512}
          alt="Generated illustration for the current scene"
          sizes="(max-width: 768px) 100vw, 720px"
          priority
          style={{ width: "100%", height: "auto", borderRadius: 10 }}
          unoptimized
        />
      ) : null}
      <p style={{ whiteSpace: "pre-wrap" }}>{scene.text}</p>
      {onSelectChoice ? (
        <StoryChoices choices={scene.choices} disabled={loading} onSelect={onSelectChoice} />
      ) : null}
    </section>
  );
}
