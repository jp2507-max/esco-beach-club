import { useMemo } from 'react';
import { FadeInUp } from 'react-native-reanimated';

import { motion, withRM } from '@/src/lib/animations/motion';

/** First N list items get staggered entering; later items use no delay. */
export const STAGGER_LIST_CAP = 8;

export const STAGGER_MS_PER_ITEM = 60;

/**
 * Reanimated entering animation for list rows (FadeInUp + stagger + Reduced Motion).
 */
export function useStaggeredListEntering(index: number) {
  return useMemo(() => {
    const delay = index < STAGGER_LIST_CAP ? index * STAGGER_MS_PER_ITEM : 0;
    return withRM(FadeInUp.delay(delay).duration(motion.dur.md).springify());
  }, [index]);
}
