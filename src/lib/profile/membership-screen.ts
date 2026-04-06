import type { TFunction } from 'i18next';
import {
  CalendarCheck,
  CreditCard,
  Headphones,
  History,
  Martini,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

import { Colors } from '@/constants/colors';
import { type RewardTierKey, rewardTierKeys } from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type RewardBenefitKey } from '@/src/lib/loyalty';
import { type InstantRecord, mapRewardTransaction } from '@/src/lib/mappers';

export type TierConfig = {
  /** Membership hero `LinearGradient` */
  gradient: readonly [string, string, ...string[]];
  qrGradientLight: readonly [string, string, string];
  qrGradientDark: readonly [string, string, string];
};

export const TIER_CONFIG: Record<RewardTierKey, TierConfig> = {
  [rewardTierKeys.member]: {
    gradient: [
      Colors.secondaryDark,
      Colors.secondary,
      Colors.tealLight,
    ] as const,
    qrGradientLight: [
      Colors.secondaryDark,
      Colors.secondary,
      Colors.tealLight,
    ] as const,
    qrGradientDark: Colors.qrMemberDark,
  },
  [rewardTierKeys.legend]: {
    gradient: [
      Colors.cardGradientStart,
      Colors.cardGradientMiddle,
      Colors.cardGradientEnd,
    ] as const,
    qrGradientLight: [
      Colors.cardGradientStart,
      Colors.cardGradientMiddle,
      Colors.cardGradientEnd,
    ] as const,
    qrGradientDark: Colors.qrLegendDark,
  },
} as const;

export function getTierQrGradient(
  tierKey: RewardTierKey,
  isDark: boolean
): readonly [string, string, string] {
  const config = TIER_CONFIG[tierKey];
  return isDark ? config.qrGradientDark : config.qrGradientLight;
}

type BenefitTitleKey =
  | 'benefits.concierge'
  | 'benefits.discountDining'
  | 'benefits.memberEvents'
  | 'benefits.poolsideDrinks'
  | 'benefits.priorityBooking';

type BenefitDescriptionKey =
  | 'benefits.discountDiningDesc'
  | 'benefits.memberEventsDesc'
  | 'benefits.poolsideDrinksDesc';

export type BenefitConfig = {
  color: string;
  descKey: BenefitDescriptionKey | null;
  icon: ComponentType<{ color?: string; size?: number }>;
  titleKey: BenefitTitleKey;
  wide: boolean;
};

export const BENEFIT_MAP: Record<RewardBenefitKey, BenefitConfig> = {
  concierge: {
    color: Colors.primary,
    descKey: null,
    icon: Headphones,
    titleKey: 'benefits.concierge',
    wide: false,
  },
  priorityBooking: {
    color: Colors.secondary,
    descKey: null,
    icon: CalendarCheck,
    titleKey: 'benefits.priorityBooking',
    wide: false,
  },
  poolsideDrinks: {
    color: Colors.gold,
    descKey: 'benefits.poolsideDrinksDesc',
    icon: Martini,
    titleKey: 'benefits.poolsideDrinks',
    wide: true,
  },
  memberEvents: {
    color: Colors.secondary,
    descKey: 'benefits.memberEventsDesc',
    icon: Sparkles,
    titleKey: 'benefits.memberEvents',
    wide: false,
  },
  discountDining: {
    color: Colors.warning,
    descKey: 'benefits.discountDiningDesc',
    icon: UtensilsCrossed,
    titleKey: 'benefits.discountDining',
    wide: true,
  },
} as const;

export type ManageItem = {
  color: string;
  icon: ComponentType<{ color?: string; size?: number }>;
  id: string;
  labelKey:
    | 'manageAccount.billingHistory'
    | 'manageAccount.managePayments'
    | 'manageAccount.upgradeTier';
};

export const MANAGE_ITEMS: ManageItem[] = [
  {
    color: Colors.primary,
    icon: TrendingUp,
    id: 'upgrade',
    labelKey: 'manageAccount.upgradeTier',
  },
  {
    color: Colors.secondary,
    icon: History,
    id: 'billing',
    labelKey: 'manageAccount.billingHistory',
  },
  {
    color: Colors.gold,
    icon: CreditCard,
    id: 'payments',
    labelKey: 'manageAccount.managePayments',
  },
];

export type MembershipActivityItem = {
  cashbackPoints: number;
  daysAgo: number;
  eventType: string;
  id: string;
};

export function useMembershipActivities(profileId: string | undefined): {
  activities: MembershipActivityItem[];
  isActivityLoading: boolean;
} {
  const activityQuery = db.useQuery(
    profileId
      ? ({
          reward_transactions: {
            $: {
              where: { 'member.id': profileId },
              order: { created_at: 'desc' },
              limit: 5,
            },
          },
        } as const)
      : null
  );

  const activities = useMemo(() => {
    const rawTxs =
      (activityQuery.data?.reward_transactions as
        | InstantRecord[]
        | undefined) ?? [];
    if (rawTxs.length === 0) return [];

    return rawTxs.map(mapRewardTransaction).map((transaction) => {
      const createdAt = transaction.created_at
        ? new Date(transaction.created_at)
        : new Date();
      const diffMs = Math.max(0, Date.now() - createdAt.getTime());
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return {
        cashbackPoints: transaction.cashback_points_delta,
        daysAgo: days,
        eventType: transaction.event_type,
        id: transaction.id,
      };
    });
  }, [activityQuery.data]);

  return {
    activities,
    isActivityLoading: Boolean(profileId) && activityQuery.isLoading,
  };
}

export function getMembershipActivityCopy(params: {
  activity: Pick<MembershipActivityItem, 'cashbackPoints' | 'eventType'>;
  t: TFunction;
}): {
  description: string;
  title: string;
} {
  const { activity, t } = params;
  const absolutePoints = Math.abs(activity.cashbackPoints).toLocaleString();

  if (activity.eventType === 'refund' || activity.eventType === 'void') {
    return {
      description: t('activity.cashbackReversedDesc', {
        points: absolutePoints,
      }),
      title: t('activity.cashbackReversed'),
    };
  }

  if (activity.eventType === 'manual_adjustment') {
    return {
      description: t('activity.cashbackAdjustedDesc', {
        points: absolutePoints,
      }),
      title: t('activity.cashbackAdjusted'),
    };
  }

  if (activity.eventType === 'tier_progress_reset') {
    return {
      description: t('activity.progressResetDesc'),
      title: t('activity.progressReset'),
    };
  }

  return {
    description: t('activity.cashbackEarnedDesc', {
      points: absolutePoints,
    }),
    title: t('activity.cashbackEarned'),
  };
}
