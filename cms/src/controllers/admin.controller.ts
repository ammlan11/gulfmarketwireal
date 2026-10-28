import { NewsStatus } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

import { getRouteParam } from "../utils/request";
import { prisma } from "../config/prisma";
import { refreshWebsite } from "../services/website-refresh.service";

import {
  createArticle,
  listAdminArticles,
  NEWS_CATEGORIES,
  updateArticle,
} from "../services/news.service";

/* =========================================
   VALIDATION
========================================= */

const articleSchema = z.object({
  title: z.string().trim().min(1).max(500),

  description: z.string().optional(),

  content: z.string().optional(),

  source: z.string().trim().min(1).max(255),

  sourceUrl: z.union([z.string().url(), z.literal("")]).optional(),

  /*
   * Must match:
   * url String @unique @db.VarChar(700)
   */
  url: z.string().url().max(700),

  publishedAt: z.string().min(1),

  category: z.enum(NEWS_CATEGORIES),

  status: z.enum(["DRAFT", "PUBLISHED"]),

  // Checkbox: present ("on") when ticked, missing when not.
  isTopStory: z.string().optional(),
});

/* =========================================
   HELPERS
========================================= */

function parseInput(body: any, imageUrl: string | null) {
  const v = articleSchema.parse(body);

  return {
    title: v.title,

    description: v.description?.trim() || null,

    content: v.content?.trim() || null,

    imageUrl,

    source: v.source,

    sourceUrl: v.sourceUrl || null,

    url: v.url,

    publishedAt: new Date(v.publishedAt),

    category: v.category,

    status: v.status as NewsStatus,

    isTopStory: v.isTopStory === "on",
  };
}

/**
 * Convert Multer's uploaded filename into
 * the path stored in the database.
 */
function getUploadedImageUrl(req: Request): string | null {
  if (!req.file) {
    return null;
  }

  return `/uploads/news/${req.file.filename}`;
}

/**
 * Delete an uploaded image from disk.
 *
 * Only /uploads/news/... paths are accepted so
 * an arbitrary filesystem path can never be deleted.
 */
async function deleteUploadedImage(imageUrl: string | null | undefined) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/news/")) {
    return;
  }

  const filename = path.basename(imageUrl);

  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "news",
    filename,
  );

  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    /*
     * Missing files don't need to break an
     * article update/delete operation.
     */
    if (error?.code !== "ENOENT") {
      console.warn("Unable to delete uploaded image:", error);
    }
  }
}

/**
 * The article currently marked as Top Story
 * (published or not), shown on the form so editors
 * know what they'll replace.
 */
async function getCurrentTopStory() {
  return prisma.newsArticle.findFirst({
    where: {
      isTopStory: true,
    },

    select: {
      id: true,
      title: true,
      status: true,
    },
  });
}

/* =========================================
   DASHBOARD
========================================= */

export async function dashboard(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;

  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;

  const status =
    req.query.status === "DRAFT" || req.query.status === "PUBLISHED"
      ? (req.query.status as NewsStatus)
      : undefined;

  const articles = await listAdminArticles(q, category, status);

  return res.render("news/index", {
    title: "News Dashboard",
    articles,
    // So Publish buttons return to this exact filtered view.
    returnTo: req.originalUrl,
    categories: NEWS_CATEGORIES,
    q: q ?? "",
    category: category ?? "",
    status: status ?? "",
  });
}

/* =========================================
   CREATE PAGE
========================================= */

export async function createPage(_req: Request, res: Response) {
  return res.render("news/form", {
    title: "Add News",
    article: null,
    categories: NEWS_CATEGORIES,
    currentTopStory: await getCurrentTopStory(),
    error: null,
  });
}

/* =========================================
   CREATE ARTICLE
========================================= */

export async function create(req: Request, res: Response) {
  const imageUrl = getUploadedImageUrl(req);

  try {
    if (!imageUrl) {
      throw new Error("A featured image is required.");
    }

    const article = await createArticle(parseInput(req.body, imageUrl));

    refreshWebsite("article created");

    return res.redirect(`/admin/news/${article.id}`);
  } catch (e: any) {
    /*
     * The upload has already happened before
     * this controller executes.
     *
     * If article creation fails, remove the
     * newly uploaded orphan file.
     */
    if (imageUrl) {
      await deleteUploadedImage(imageUrl);
    }

    return res.status(400).render("news/form", {
      title: "Add News",

      article: {
        ...req.body,
        isTopStory: req.body?.isTopStory === "on",
      },

      categories: NEWS_CATEGORIES,

      currentTopStory: await getCurrentTopStory(),

      error:
        e?.issues?.[0]?.message ?? e?.message ?? "Unable to create article.",
    });
  }
}

/* =========================================
   VIEW ARTICLE
========================================= */

export async function view(req: Request, res: Response) {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).render("error", {
      title: "Invalid Request",
      message: "Article ID is required.",
    });
  }

  const article = await prisma.newsArticle.findUnique({
    where: {
      id,
    },
  });

  if (!article) {
    return res.status(404).render("error", {
      title: "Not Found",
      message: "Article not found.",
    });
  }

  return res.render("news/view", {
    title: article.title,
    article,
  });
}

/* =========================================
   EDIT PAGE
========================================= */

export async function editPage(req: Request, res: Response) {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).render("error", {
      title: "Invalid Request",
      message: "Article ID is required.",
    });
  }

  const article = await prisma.newsArticle.findUnique({
    where: {
      id,
    },
  });

  if (!article) {
    return res.status(404).render("error", {
      title: "Not Found",
      message: "Article not found.",
    });
  }

  return res.render("news/form", {
    title: "Edit News",
    article,
    categories: NEWS_CATEGORIES,
    currentTopStory: await getCurrentTopStory(),
    error: null,
  });
}

/* =========================================
   EDIT ARTICLE
========================================= */

export async function edit(req: Request, res: Response) {
  const id = getRouteParam(req.params.id);

  if (!id) {
    const uploadedImage = getUploadedImageUrl(req);

    if (uploadedImage) {
      await deleteUploadedImage(uploadedImage);
    }

    return res.status(400).render("error", {
      title: "Invalid Request",
      message: "Article ID is required.",
    });
  }

  const existingArticle = await prisma.newsArticle.findUnique({
    where: {
      id,
    },
  });

  if (!existingArticle) {
    /*
     * Multer may already have uploaded a new
     * image before we discover that the article
     * doesn't exist. Clean it up.
     */
    const uploadedImage = getUploadedImageUrl(req);

    if (uploadedImage) {
      await deleteUploadedImage(uploadedImage);
    }

    return res.status(404).render("error", {
      title: "Not Found",
      message: "Article not found.",
    });
  }

  const uploadedImage = getUploadedImageUrl(req);

  /*
   * New upload -> use new image.
   * No upload  -> preserve existing image.
   */
  const imageUrl = uploadedImage ?? existingArticle.imageUrl;

  try {
    const article = await updateArticle(id, parseInput(req.body, imageUrl));

    /*
     * Database update succeeded.
     *
     * We can now safely remove the old image.
     */
    if (
      uploadedImage &&
      existingArticle.imageUrl &&
      existingArticle.imageUrl !== uploadedImage
    ) {
      await deleteUploadedImage(existingArticle.imageUrl);
    }

    // Covers edits and Top Story changes (the checkbox is on this form).
    refreshWebsite("article edited");

    return res.redirect(`/admin/news/${article.id}`);
  } catch (e: any) {
    /*
     * Database/validation failed.
     *
     * Keep the existing image and remove only
     * the newly uploaded replacement.
     */
    if (uploadedImage) {
      await deleteUploadedImage(uploadedImage);
    }

    return res.status(400).render("news/form", {
      title: "Edit News",

      article: {
        ...req.body,
        id,

        /*
         * Show the existing image again
         * because the replacement failed.
         */
        imageUrl: existingArticle.imageUrl,

        isTopStory: req.body?.isTopStory === "on",
      },

      categories: NEWS_CATEGORIES,

      currentTopStory: await getCurrentTopStory(),

      error:
        e?.issues?.[0]?.message ?? e?.message ?? "Unable to update article.",
    });
  }
}

/* =========================================
   DELETE ARTICLE
========================================= */

export async function remove(req: Request, res: Response) {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).render("error", {
      title: "Invalid Request",
      message: "Article ID is required.",
    });
  }

  const article = await prisma.newsArticle.findUnique({
    where: {
      id,
    },
  });

  if (!article) {
    return res.status(404).render("error", {
      title: "Not Found",
      message: "Article not found.",
    });
  }

  await prisma.newsArticle.delete({
    where: {
      id,
    },
  });

  /*
   * Delete the image only after the database
   * record has successfully been deleted.
   */
  await deleteUploadedImage(article.imageUrl);

  refreshWebsite("article deleted");

  return res.redirect("/admin/news");
}

/* =========================================
   ONE-CLICK PUBLISH / MOVE TO DRAFT
========================================= */

/*
 * POST /admin/news/:id/status   body: status=PUBLISHED|DRAFT
 *
 * Used by the Publish / Move to draft buttons on the dashboard
 * and the article page. Only the status changes; the article's
 * text, photo and date stay as they are.
 */
export async function changeStatus(req: Request, res: Response) {
  const id = getRouteParam(req.params.id);

  const status =
    req.body?.status === "PUBLISHED" || req.body?.status === "DRAFT"
      ? (req.body.status as NewsStatus)
      : null;

  if (!id || !status) {
    return res.status(400).render("error", {
      title: "Invalid Request",
      message: "Article ID and a valid status are required.",
    });
  }

  const updated = await prisma.newsArticle.updateMany({
    where: { id },
    data: { status },
  });

  if (updated.count === 0) {
    return res.status(404).render("error", {
      title: "Not Found",
      message: "Article not found.",
    });
  }

  refreshWebsite(status === "PUBLISHED" ? "article published" : "article moved to draft");

  // Go back to the page the button was on (dashboard keeps its filters).
  const returnTo =
    typeof req.body?.returnTo === "string" &&
    req.body.returnTo.startsWith("/admin/") &&
    !req.body.returnTo.startsWith("//")
      ? req.body.returnTo
      : "/admin/news";

  return res.redirect(returnTo);
}
