import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Make Story Time",
  description: "Interactive children's storytelling app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="card" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
          <div className="container row" style={{ justifyContent: "space-between" }}>
            <strong>Make Story Time</strong>
            <nav className="row">
              <Link href="/create">Create story</Link>
              <Link href="/library">Library</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
