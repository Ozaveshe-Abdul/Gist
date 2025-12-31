export interface NewsArticle {
  id: string;
  title: string;
  gist: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
}

export type CategoryType = 'General' | 'Home Politics' | 'Inter Politics' | 'Technology' | 'Business' | 'Science' | 'Sports' | 'Entertainment' | 'Health' | 'Bookmarks';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DeepAnalysis {
  context: string;
  implications: string;
  conclusion: string;
}