import { z } from 'zod';

import {
  memberSegments,
  onboardingPermissionStatuses,
  posBillStatuses,
  rewardTierKeys,
  rewardTransactionEventTypes,
  rewardTransactionSources,
  rewardTransactionStatuses,
} from '@/lib/types';

const memberSegmentValues = [
  memberSegments.longTerm,
  memberSegments.shortTerm,
] as const;
const onboardingPermissionStatusValues = [
  onboardingPermissionStatuses.denied,
  onboardingPermissionStatuses.granted,
  onboardingPermissionStatuses.undetermined,
] as const;
const rewardTierValues = [
  rewardTierKeys.member,
  rewardTierKeys.legend,
] as const;
const rewardTransactionEventTypeValues = [
  rewardTransactionEventTypes.manualAdjustment,
  rewardTransactionEventTypes.purchase,
  rewardTransactionEventTypes.refund,
  rewardTransactionEventTypes.tierProgressReset,
  rewardTransactionEventTypes.void,
] as const;
const sqlPollerRewardEventTypeValues = [
  rewardTransactionEventTypes.purchase,
  rewardTransactionEventTypes.refund,
  rewardTransactionEventTypes.void,
] as const;
const rewardTransactionSourceValues = [
  rewardTransactionSources.localPosPoller,
  rewardTransactionSources.manualStaffEntry,
  rewardTransactionSources.memberBillQr,
  rewardTransactionSources.systemReconcile,
] as const;
const rewardTransactionStatusValues = [
  rewardTransactionStatuses.pending,
  rewardTransactionStatuses.posted,
  rewardTransactionStatuses.rejected,
] as const;
const posBillStatusValues = [
  posBillStatuses.open,
  posBillStatuses.paid,
  posBillStatuses.refunded,
  posBillStatuses.voided,
] as const;
const posBillIdPattern = /^[A-Za-z0-9._-]{1,128}$/;

const isoDateTimeLikeSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => value.includes('T') && !Number.isNaN(Date.parse(value)), {
    message: 'Invalid ISO datetime string',
  });

export const sqlPollerRewardEventSchema = z.object({
  amountVnd: z.number().int().nonnegative(),
  eventId: z.string().trim().min(1),
  eventType: z.enum(sqlPollerRewardEventTypeValues),
  memberId: z.string().trim().min(1),
  occurredAt: z.string().trim().min(1),
  reference: z.string().trim().min(1).nullable().optional(),
  source: z.literal(rewardTransactionSources.localPosPoller),
});

export type SqlPollerRewardEvent = z.infer<typeof sqlPollerRewardEventSchema>;

export const manualRewardAdjustmentRequestSchema = z.object({
  billAmountVnd: z.number().int().positive(),
  memberId: z.string().trim().min(1),
  receiptReference: z.string().trim().min(1),
  staffUserId: z.string().trim().min(1),
});

export type ManualRewardAdjustmentRequest = z.infer<
  typeof manualRewardAdjustmentRequestSchema
>;

export const posBillSyncItemSchema = z
  .object({
    amountVnd: z.number().int().nonnegative(),
    closedAt: isoDateTimeLikeSchema.nullable().optional(),
    currency: z.string().trim().toUpperCase().pipe(z.literal('VND')),
    paidAt: isoDateTimeLikeSchema.nullable().optional(),
    posBillId: z.string().trim().regex(posBillIdPattern),
    receiptReference: z.string().trim().min(1).nullable().optional(),
    restaurantId: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{2,64}$/),
    sourceUpdatedAt: isoDateTimeLikeSchema,
    status: z.enum(posBillStatusValues),
    terminalId: z.string().trim().min(1).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === posBillStatuses.paid && !value.paidAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'paidAt is required when status is PAID',
        path: ['paidAt'],
      });
    }
  });

export type PosBillSyncItem = z.infer<typeof posBillSyncItemSchema>;

export const posBillSyncRequestSchema = z.object({
  bills: z.array(posBillSyncItemSchema).min(1).max(100),
});

export type PosBillSyncRequest = z.infer<typeof posBillSyncRequestSchema>;

export const posBillSyncResponseSchema = z.object({
  processed: z.number().int().nonnegative(),
  upserted: z.number().int().nonnegative(),
});

export type PosBillSyncResponse = z.infer<typeof posBillSyncResponseSchema>;

export const rewardProfilePayloadSchema = z.object({
  avatar_url: z.string().nullable(),
  bio: z.string(),
  cashback_points_balance: z.number().int(),
  cashback_points_lifetime_earned: z.number().int(),
  created_at: z.string().trim().min(1),
  date_of_birth: z.string().nullable(),
  full_name: z.string(),
  has_seen_welcome_voucher: z.boolean(),
  id: z.string().trim().min(1),
  lifetime_tier_key: z.enum(rewardTierValues),
  location_permission_status: z.enum(onboardingPermissionStatusValues),
  member_id: z.string().trim().min(1),
  member_segment: z.enum(memberSegmentValues).nullable(),
  member_since: z.string().trim().min(1),
  next_tier_key: z.enum(rewardTierValues).nullable(),
  nights_left: z.number().int(),
  onboarding_completed_at: z.string().nullable(),
  push_notification_permission_status: z.enum(onboardingPermissionStatusValues),
  referral_code: z.string().trim().min(1),
  saved: z.number().int(),
  tier_progress_expires_at: z.string().nullable(),
  tier_progress_points: z.number().int(),
  tier_progress_started_at: z.string().nullable(),
  tier_progress_target_points: z.number().int(),
  updated_at: z.string().trim().min(1),
});

export const rewardTransactionPayloadSchema = z.object({
  amount_vnd: z.number().int().nonnegative(),
  cashback_points_delta: z.number().int(),
  created_at: z.string().trim().min(1),
  entry_key: z.string().trim().min(1),
  event_type: z.enum(rewardTransactionEventTypeValues),
  external_event_id: z.string().trim().min(1),
  id: z.string().trim().min(1),
  member_id: z.string().trim().min(1),
  member_profile_id: z.string().nullable(),
  occurred_at: z.string().trim().min(1),
  reference: z.string().nullable(),
  source: z.enum(rewardTransactionSourceValues),
  status: z.enum(rewardTransactionStatusValues),
  tier_progress_points_delta: z.number().int(),
  updated_at: z.string().trim().min(1),
});

export const rewardServiceResponseSchema = z.object({
  cashbackPointsDelta: z.number().int(),
  member: rewardProfilePayloadSchema,
  tierProgressPointsDelta: z.number().int(),
  transaction: rewardTransactionPayloadSchema,
});

export type RewardServiceResponse = z.infer<typeof rewardServiceResponseSchema>;
