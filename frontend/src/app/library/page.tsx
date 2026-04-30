"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LibraryItem } from "../../types/story";
import { getLibrary } from "../../lib/api/library";

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setItems(await getLibrary());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load library.");
      }
    })();
  }, []);

  return (
    <section className="card grid">
      <h1>Your story library</h1>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {items.length === 0 ? <p>No saved stories yet.</p> : null}
      {items.map((item) => (
        <article key={item.libraryEntryId} className="card">
          <h3>{item.title}</h3>
          <p>Main character: {item.childName}</p>
          <p>Last read scene: {item.lastReadSceneIndex + 1}</p>
          <Link href={`/library/${item.libraryEntryId}`}>Resume story</Link>
        </article>
      ))}
    </section>
  );
}
