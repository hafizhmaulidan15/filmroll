import { put, del, head } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // exists
  }
}

function isVercel(): boolean {
  return !!(process.env.VERCEL_URL || process.env.VERCEL);
}

export async function saveFile(
  buffer: Buffer,
  mimeType: string,
  rollId: string
): Promise<{ storagePath: string; fileSize: number }> {
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  const filename = `${uuidv4()}.${ext}`;

  if (isVercel()) {
    const blob = await put(`uploads/${rollId}/${filename}`, buffer, {
      contentType: mimeType,
      access: "public",
    });
    return { storagePath: blob.url, fileSize: buffer.length };
  }

  const relativePath = path.join("uploads", rollId, filename);
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  await ensureDir(path.dirname(absolutePath));
  await fs.writeFile(absolutePath, buffer);

  return { storagePath: relativePath.replace(/\\/g, "/"), fileSize: buffer.length };
}

export async function deleteFile(storagePath: string) {
  try {
    if (isVercel()) {
      await del(storagePath);
      return;
    }
    const absolutePath = path.join(process.cwd(), "public", storagePath);
    await fs.unlink(absolutePath);
  } catch {
    // ignore
  }
}

export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    if (isVercel()) {
      await head(storagePath);
      return true;
    }
    const absolutePath = path.join(process.cwd(), "public", storagePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export function getPublicUrl(storagePath: string): string {
  if (storagePath.startsWith("http")) return storagePath;
  return `/${storagePath.replace(/\\/g, "/")}`;
}
