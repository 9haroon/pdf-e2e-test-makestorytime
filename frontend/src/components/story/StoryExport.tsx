"use client";

import { exportUrl } from "../../lib/api/stories";

interface StoryExportProps {
  storyId: string;
}

export function StoryExport({ storyId }: StoryExportProps) {
  return (
    <div className="row">
      <a className="btn secondary" href={exportUrl(storyId, "pdf")} target="_blank" rel="noreferrer">
        Export PDF
      </a>
      <a className="btn secondary" href={exportUrl(storyId, "text")} target="_blank" rel="noreferrer">
        Export text
      </a>
      <a className="btn secondary" href={exportUrl(storyId, "images_only")} target="_blank" rel="noreferrer">
        Export images list
      </a>
    </div>
  );
}
