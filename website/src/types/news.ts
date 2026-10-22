export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  content?: string;
  imageUrl: string | null;
  source: string;
  sourceUrl?: string;
  url: string;
  publishedAt: string;

  category?: string;

  // Chosen in the CMS as the home page Top Story.
  isTopStory?: boolean;
};