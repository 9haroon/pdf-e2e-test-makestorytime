"use client";

import type { StoryChoiceResponse } from "../../types/story";

interface StoryChoicesProps {
  choices: StoryChoiceResponse[];
  disabled?: boolean;
  onSelect: (choiceId: string) => void;
}

export function StoryChoices({ choices, disabled, onSelect }: StoryChoicesProps) {
  if (choices.length === 0) {
    return <p>The story has reached a cozy ending.</p>;
  }

  return (
    <div className="grid">
      <h3>What should happen next?</h3>
      <div className="row">
        {choices.map((choice) => (
          <button
            key={choice.id}
            className="btn secondary"
            type="button"
            onClick={() => onSelect(choice.id)}
            disabled={disabled}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
