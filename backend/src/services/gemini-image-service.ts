import type { Env } from "../config/env.js";

export interface GeminiImageResult {
  /** PNG or JPEG bytes */
  buffer: Buffer;
  mimeType: string;
}

/**
 * Image generation hook. When no remote model is configured, produces a soft
 * pastel SVG illustration so the pipeline stays runnable offline.
 */
export class GeminiImageService {
  constructor(private readonly env: Env) {}

  async generateSceneIllustration(params: {
    /** Short visual description derived from scene text */
    sceneSummary: string;
    childSafe: boolean;
  }): Promise<GeminiImageResult> {
    if (!params.childSafe) {
      throw new Error("Unsafe visual prompt blocked.");
    }

    if (this.env.GEMINI_API_KEY && this.env.GEMINI_IMAGE_MODEL) {
      try {
        return await this.generateWithGemini(params.sceneSummary);
      } catch {
        /* fall through to SVG */
      }
    }

    const svg = buildPlaceholderSvg(params.sceneSummary);
    return {
      buffer: Buffer.from(svg, "utf-8"),
      mimeType: "image/svg+xml",
    };
  }

  private async generateWithGemini(sceneSummary: string): Promise<GeminiImageResult> {
    const apiKey = this.env.GEMINI_API_KEY;
    const modelName = this.env.GEMINI_IMAGE_MODEL;
    if (!apiKey || !modelName) {
      throw new Error("Missing image model configuration.");
    }

    const body = {
      contents: [
        {
          parts: [
            {
              text: `Create a square child-friendly illustration with soft colors for: ${sceneSummary}`,
            },
          ],
        },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Gemini image HTTP ${String(res.status)}`);
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
    };
    const dataB64 =
      json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (!dataB64) {
      throw new Error("No inline image data from Gemini response.");
    }
    return {
      buffer: Buffer.from(dataB64, "base64"),
      mimeType: "image/png",
    };
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPlaceholderSvg(sceneSummary: string): string {
  const label = escapeXml(sceneSummary.slice(0, 120));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde7f3"/>
      <stop offset="100%" stop-color="#dcecff"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" rx="24"/>
  <circle cx="140" cy="160" r="56" fill="#ffd27f" opacity="0.85"/>
  <circle cx="380" cy="120" r="34" fill="#ffffff" opacity="0.75"/>
  <path d="M80 360 Q256 260 432 360 L432 420 L80 420 Z" fill="#b7f0c9" opacity="0.85"/>
  <text x="256" y="440" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#445566">${label}</text>
</svg>`;
}
