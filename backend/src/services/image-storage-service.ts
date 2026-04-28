import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { Env } from "../config/env.js";

/**
 * Persists binary assets locally and exposes HTTP URLs relative to PUBLIC_API_BASE_URL.
 * Swap for S3/GCS upload while keeping the same interface.
 */
export class ImageStorageService {
  constructor(private readonly env: Env) {}

  async saveImage(params: {
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ imageUrl: string; relativePath: string }> {
    const ext = mimeToExt(params.mimeType);
    const fileName = `${randomUUID()}${ext}`;
    const dir = path.resolve(this.env.LOCAL_IMAGE_STORAGE_DIR);
    await mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, fileName);
    await writeFile(fullPath, params.buffer);
    const relativePath = `/static/images/${fileName}`;
    const base = this.env.PUBLIC_API_BASE_URL.replace(/\/$/, "");
    const imageUrl = `${base}${relativePath}`;
    return { imageUrl, relativePath };
  }
}

function mimeToExt(mime: string): string {
  if (mime.includes("svg")) return ".svg";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  return ".png";
}
