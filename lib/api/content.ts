import type { NewsItem } from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapNewsItem } from '@/src/lib/mappers';

export async function fetchNewsFeed(): Promise<NewsItem[]> {
  const { data } = await db.queryOnce({ news_items: {} });
  return (data.news_items as InstantRecord[]).map(mapNewsItem);
}
