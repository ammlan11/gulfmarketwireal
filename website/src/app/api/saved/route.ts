import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
 * GET /api/saved
 *
 * Return all articles saved by the
 * currently authenticated user.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const savedArticles =
      await prisma.savedArticle.findMany({
        where: {
          userId: user.id,
        },

        include: {
          article: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,
      savedArticles,
    });
  } catch (error) {
    console.error(
      "Unable to load saved articles:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load saved articles.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * POST /api/saved
 *
 * Save an article for the currently
 * authenticated user.
 */
export async function POST(
  request: Request,
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const articleId = String(
      body.articleId ?? "",
    ).trim();

    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Article ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Verify that the article really exists.
     */
    const article =
      await prisma.newsArticle.findUnique({
        where: {
          id: articleId,
        },

        select: {
          id: true,
        },
      });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          message: "Article not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * upsert makes the operation idempotent:
     * saving the same article twice won't
     * create duplicate rows.
     */
    const savedArticle =
      await prisma.savedArticle.upsert({
        where: {
          userId_articleId: {
            userId: user.id,
            articleId,
          },
        },

        update: {},

        create: {
          userId: user.id,
          articleId,
        },

        include: {
          article: true,
        },
      });

    return NextResponse.json({
      success: true,
      savedArticle,
    });
  } catch (error) {
    console.error(
      "Unable to save article:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save article.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * DELETE /api/saved
 *
 * Remove an article from the current
 * user's saved stories.
 */
export async function DELETE(
  request: Request,
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const articleId = String(
      body.articleId ?? "",
    ).trim();

    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Article ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.savedArticle.deleteMany({
      where: {
        userId: user.id,
        articleId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Unable to remove saved article:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to remove saved article.",
      },
      {
        status: 500,
      },
    );
  }
}