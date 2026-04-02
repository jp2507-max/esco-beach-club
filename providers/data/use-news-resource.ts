import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import { type InstantRecord, mapNewsItem } from '@/src/lib/mappers';

import { EMPTY_NEWS, type NewsData } from './context';

type NewsResourceParams = {
  userId: string;
};

export function useNewsResource(params: NewsResourceParams): NewsData {
  const { userId } = params;
  const newsQuery = db.useQuery(userId ? { news_items: {} } : null);

  const news = useMemo(() => {
    if (!userId) return EMPTY_NEWS;
    const records = (newsQuery.data?.news_items ?? []) as InstantRecord[];
    return records.map(mapNewsItem);
  }, [newsQuery.data, userId]);

  return useMemo(
    () => ({
      news,
      newsLoading: Boolean(userId) && newsQuery.isLoading,
    }),
    [news, newsQuery.isLoading, userId]
  );
}
