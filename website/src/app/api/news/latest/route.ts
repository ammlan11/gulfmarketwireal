import { NextResponse } from "next/server";
import { getLatestBusinessNews } from "@/services/news.service";
import { getCurrentUser } from "@/lib/auth";

/*
 * GET /api/news/latest
 *
 * Return latest business news articles.
 * Member-only access control: Authenticated users receive full article data;
 * unauthenticated guests receive sanitized public preview metadata only.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const rawArticles = await getLatestBusinessNews();

    // Server-side response sanitization:
    // Logged-in members get full article objects.
    // Unauthenticated guests get explicit public preview fields only (no content, no external url).
    const articles = user
      ? rawArticles
      : rawArticles.map((article) => ({
          id: article.id,
          title: article.title,
          description: article.description,
          imageUrl: article.imageUrl,
          source: article.source,
          publishedAt: article.publishedAt,
          category: article.category,
        }));

    return NextResponse.json({
      success: true,
      articles,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Latest news API error:", error);

    return NextResponse.json(
      {
        success: false,
        articles: [],
        message: "Unable to load latest news",
      },
      {
        status: 500,
      }
    );
  }
}
