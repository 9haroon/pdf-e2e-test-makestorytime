"use client";

import { useState } from "react";
import { saveStory } from "../../lib/api/library";

interface SaveToLibraryButtonProps {
  storyId: string;
}

export function SaveToLibraryButton({ storyId }: SaveToLibraryButtonProps) {
  const [status, setStatus] = useState<string>("");

  async function onSave(): Promise<void> {
    setStatus("Saving...");
    try {
      const res = await saveStory(storyId);
      setStatus(`Saved to library (${res.libraryEntryId.slice(0, 8)}…)`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save story.");
    }
  }

  return (
    <div className="row">
      <button type="button" className="btn secondary" onClick={onSave}>
        Save to library
      </button>
      <span>{status}</span>
    </div>
  );
}
