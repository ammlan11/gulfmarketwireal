import { NextResponse } from "next/server";
import { searchNews } from "@/services/news.service";
import { getCurrentUser } from "@/lib/auth";

/*
 * GET /api/news/search?q=query
 *
 * Search financial news articles by query keyword.
 * Member-only access control: Authenticated users receive full article data;
 * unauthenticated guests receive sanitized public preview metadata only.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";

    if (!query.trim()) {
      return NextResponse.json(
        {
          success: false,
          articles: [],
          message: "Query parameter 'q' is required.",
        },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const rawArticles = await searchNews(query.trim());

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
      query: query.trim(),
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("News search error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to search news articles.",
      },
      { status: 500 }
    );
  }
}
