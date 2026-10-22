import { NewsStatus } from "@prisma/client";
import { Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { generateArticleId } from "../utils/article-id";
import { createArticle, NEWS_CATEGORIES } from "../services/news.service";
import {
  downloadImage,
  searchPexels,
  type FoundImage,
} from "../services/image.service";

/*
 * POST /api/ingest/news
 *
 * Lets the automated news task add articles to the CMS.
 *
 *   Header:  Authorization: Bearer <INGEST_API_KEY>
 *   Body:    JSON (see ingestSchema)
 *
 * Articles are saved as DRAFT unless "status": "PUBLISHED" is sent.
 * The photo is found on Pexels from "imageQuery", or taken from
 * "imageUrl" (Pexels or Unsplash only), then stored like a normal
 * upload. Sending the same source URL twice returns 409.
 */

// Friendly names the writer uses, mapped to CMS categories.
const CATEGORY_ALIASES: Record<string, (typeof NEWS_CATEGORIES)[number]> = {
  "WORLD ECONOMY": "ECONOMICS",
  "MIDDLE EAST ECONOMY": "BUSINESS",
  "DOLLAR & GOLD": "FINANCE",
  "DOLLAR AND GOLD": "FINANCE",
};

const ingestSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  content: z.string().trim().min(1).max(100_000),

  // Publisher names, e.g. "Reuters, The National"
  source: z.string().trim().min(1).max(255),
  sourceUrl: z.string().url().optional(),

  // The main source article's URL. Must be unique: it is how
  // the CMS spots a story that was already added.
  url: z.string().url().max(700),

  category: z.string().trim().min(1),
  publishedAt: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),

  imageQuery: z.string().trim().min(2).max(100).optional(),
  imageUrl: z.string().url().optional(),
  imageCredit: z.string().trim().max(200).optional(),
});

function checkKey(req: Request): boolean {
  const expected = env.INGEST_API_KEY;

  if (!expected) return false;

  const header = req.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

function toCategory(value: string): (typeof NEWS_CATEGORIES)[number] | null {
  const upper = value.trim().toUpperCase();

  if ((NEWS_CATEGORIES as readonly string[]).includes(upper)) {
    return upper as (typeof NEWS_CATEGORIES)[number];
  }

  return CATEGORY_ALIASES[upper] ?? null;
}

/*
 * The website shows content as plain paragraphs, so tidy away
 * Markdown the writer may include.
 */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function ingestNews(req: Request, res: Response) {
  if (!env.INGEST_API_KEY) {
    return res.status(503).json({ error: "Ingest is not enabled on this CMS." });
  }

  if (!checkKey(req)) {
    return res.status(401).json({ error: "Invalid or missing API key." });
  }

  const parsed = ingestSchema.safeParse(req.body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return res.status(400).json({
      error: `${issue.path.join(".") || "body"}: ${issue.message}`,
    });
  }

  const input = parsed.data;
  const category = toCategory(input.category);

  if (!category) {
    return res.status(400).json({
      error: `Unknown category "${input.category}". Use one of: ${[
        ...NEWS_CATEGORIES,
        ...Object.keys(CATEGORY_ALIASES),
      ].join(", ")}.`,
    });
  }

  // Same source URL already in the CMS = same story.
  const existing = await prisma.newsArticle.findUnique({
    where: { id: generateArticleId(input.url) },
    select: { id: true, title: true, status: true },
  });

  if (existing) {
    return res.status(409).json({
      error: "This story is already in the CMS.",
      id: existing.id,
      title: existing.title,
      status: existing.status,
    });
  }

  // ===== Photo =====
  let image: FoundImage | null = null;

  try {
    if (input.imageUrl) {
      image = {
        url: input.imageUrl,
        credit: input.imageCredit ?? "",
      };
    } else if (input.imageQuery) {
      image = await searchPexels(input.imageQuery);

      if (!image) {
        return res.status(422).json({
          error: `No unused photo found for "${input.imageQuery}". Try a broader search.`,
        });
      }
    } else {
      return res.status(400).json({
        error: "Send imageQuery (a Pexels search) or imageUrl.",
      });
    }
  } catch (error: any) {
    return res.status(502).json({ error: error?.message ?? "Image search failed." });
  }

  let imagePath: string;

  try {
    imagePath = await downloadImage(image);
  } catch (error: any) {
    return res.status(422).json({ error: error?.message ?? "Image download failed." });
  }

  // ===== Article =====
  const content = [toPlainText(input.content), image.credit]
    .filter(Boolean)
    .join("\n\n");

  try {
    const article = await createArticle({
      title: input.title,
      description: input.description ?? null,
      content,
      imageUrl: imagePath,
      source: input.source,
      sourceUrl: input.sourceUrl ?? null,
      url: input.url,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
      category,
      status: (input.status ?? "DRAFT") as NewsStatus,
      isTopStory: false,
    });

    const base = env.PUBLIC_BASE_URL.replace(/\/$/, "");

    return res.status(201).json({
      id: article.id,
      title: article.title,
      status: article.status,
      category: article.category,
      imageCredit: image.credit,
      editUrl: `${base}/admin/news/${article.id}/edit`,
    });
  } catch (error: any) {
    console.error("Ingest failed:", error);

    // Don't leave an orphaned photo behind.
    await fs
      .unlink(path.join(process.cwd(), "public", imagePath))
      .catch(() => {});

    return res.status(500).json({ error: "Could not save the article." });
  }
}
