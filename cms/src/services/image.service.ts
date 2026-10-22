import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import { env } from "../config/env";

/*
 * Finds and downloads licensed photos for automated articles.
 *
 * Only Pexels and Unsplash image hosts are allowed: both licence
 * their photos for free commercial use, and limiting the hosts
 * stops the CMS being made to download from arbitrary addresses.
 */

const ALLOWED_IMAGE_HOSTS = new Set(["images.pexels.com", "images.unsplash.com"]);

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads", "news");

export type FoundImage = {
  url: string;
  credit: string; // e.g. "Photo: Jane Doe / Pexels"
  pexelsId?: number;
};

/*
 * Pexels IDs already used, read from saved filenames
 * ("pexels-<id>-..."), so articles don't repeat a photo.
 */
async function usedPexelsIds(): Promise<Set<number>> {
  try {
    const files = await fs.readdir(UPLOAD_DIRECTORY);

    return new Set(
      files
        .map((name) => /^pexels-(\d+)-/.exec(name)?.[1])
        .filter((id): id is string => Boolean(id))
        .map(Number),
    );
  } catch {
    return new Set();
  }
}

type PexelsPhoto = {
  id: number;
  photographer: string;
  alt?: string;
  src: { large2x?: string; large?: string; original: string };
};

/*
 * Searches Pexels for a landscape photo matching the query,
 * skipping photos already used on the site.
 */
export async function searchPexels(query: string): Promise<FoundImage | null> {
  if (!env.PEXELS_API_KEY) {
    throw new Error("PEXELS_API_KEY is not set on the CMS server.");
  }

  const params = new URLSearchParams({
    query,
    orientation: "landscape",
    per_page: "15",
  });

  const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: env.PEXELS_API_KEY },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Pexels search failed (${response.status}).`);
  }

  const data = (await response.json()) as { photos?: PexelsPhoto[] };
  const used = await usedPexelsIds();
  const photos = (data.photos ?? []).filter((photo) => !used.has(photo.id));

  if (photos.length === 0) return null;

  // Pick from the top few so similar stories don't all get the same photo.
  const photo = photos[Math.floor(Math.random() * Math.min(5, photos.length))];

  return {
    url: photo.src.large2x ?? photo.src.large ?? photo.src.original,
    credit: `Photo: ${photo.photographer} / Pexels`,
    pexelsId: photo.id,
  };
}

/*
 * Downloads an image from an allowed host into the CMS uploads
 * folder and returns its stored path (/uploads/news/...).
 */
export async function downloadImage(image: FoundImage): Promise<string> {
  let host: string;

  try {
    host = new URL(image.url).hostname;
  } catch {
    throw new Error("Image URL is not valid.");
  }

  if (!ALLOWED_IMAGE_HOSTS.has(host)) {
    throw new Error(
      `Images can only come from ${[...ALLOWED_IMAGE_HOSTS].join(" or ")}.`,
    );
  }

  const response = await fetch(image.url, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}).`);
  }

  const type = (response.headers.get("content-type") ?? "").split(";")[0].trim();
  const extension = EXTENSIONS[type];

  if (!extension) {
    throw new Error(`Unsupported image type: ${type || "unknown"}.`);
  }

  const declared = Number(response.headers.get("content-length") ?? 0);

  if (declared > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 15 MB.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 15 MB.");
  }

  const prefix = image.pexelsId ? `pexels-${image.pexelsId}-` : "";
  const filename = `${prefix}${Date.now()}-${crypto.randomUUID()}${extension}`;

  await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIRECTORY, filename), buffer);

  return `/uploads/news/${filename}`;
}
