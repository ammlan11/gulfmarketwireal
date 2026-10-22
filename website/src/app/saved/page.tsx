import { redirect } from "next/navigation";

import Header from "@/components/layout/Header/Header";
import SavedPage from "@/components/saved/SavedPage/SavedPage";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import type { NewsArticle } from "@/types/news";

export default async function SavedRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const savedRecords =
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

  const articles: NewsArticle[] =
    savedRecords.map(({ article }) => ({
      id: article.id,
      title: article.title,
      description:
        article.description ?? "",
      content:
        article.content ?? undefined,
      imageUrl: article.imageUrl,
      source: article.source,
      sourceUrl:
        article.sourceUrl ?? undefined,
      url: article.url,
      publishedAt:
        article.publishedAt.toISOString(),
      category:
        article.category ?? undefined,
    }));

  return (
    <>
      <Header />

      <SavedPage
        user={user}
        articles={articles}
      />
    </>
  );
}