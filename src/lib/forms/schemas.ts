import { z } from 'zod';

import { memberSegments } from '@/lib/types';
import { rewardConfig } from '@/src/lib/loyalty';

const v = (key: string) => `common:validation.${key}` as const;

/** Validates YYYY-MM-DD is a real calendar date (no rollover). */
function isValidCalendarDate(s: string): boolean {
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12 || !d || d < 1) return false;
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

// Shared field validators
const dateOfBirthField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: v('invalidDate') })
  .refine(isValidCalendarDate, { error: v('invalidDate') });

const displayNameField = z
  .string()
  .trim()
  .min(2, { error: v('profileNameMin') })
  .max(60, { error: v('profileNameMax') });

/** Shared schema for email-code auth (login/signup). */
export const emailAuthSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ error: v('email') }),
});

export type EmailFormValues = z.infer<typeof emailAuthSchema>;

export const loginSchema = emailAuthSchema;

export type LoginFormValues = z.infer<typeof loginSchema>;

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, { error: v('invalidCode') })
    .regex(/^\d{6}$/, { error: v('invalidCode') }),
});

export type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

export const signupSchema = emailAuthSchema.extend({
  dateOfBirth: dateOfBirthField,
  displayName: displayNameField,
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const onboardingBasicsSchema = z.object({
  dateOfBirth: dateOfBirthField,
  displayName: displayNameField,
});

export type OnboardingBasicsFormValues = z.infer<typeof onboardingBasicsSchema>;

export const onboardingLocalIdentitySchema = z.object({
  acceptedPrivacyPolicy: z
    .boolean()
    .refine((value) => value === true, { error: v('required') }),
  acceptedTerms: z
    .boolean()
    .refine((value) => value === true, { error: v('required') }),
  memberSegment: z.enum([memberSegments.local, memberSegments.foreigner], {
    error: v('required'),
  }),
});

export type OnboardingLocalIdentityFormValues = z.infer<
  typeof onboardingLocalIdentitySchema
>;

export const onboardingFinalDetailsSchema = z.object({
  locationServicesEnabled: z.boolean(),
  stayInformedEnabled: z.boolean(),
});

export type OnboardingFinalDetailsFormValues = z.infer<
  typeof onboardingFinalDetailsSchema
>;

export const privateEventSchema = z.object({
  eventType: z
    .string()
    .trim()
    .min(1, { error: v('required') }),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: v('invalidDate') })
    .refine(isValidCalendarDate, { error: v('invalidDate') })
    .transform((s) => new Date(s)),
  estimatedPax: z
    .string()
    .trim()
    .regex(/^\d+$/, { error: v('number') })
    .refine((value) => Number.parseInt(value, 10) > 0, {
      error: v('positiveNumber'),
    }),
  contactName: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.email().safeParse(value).success, {
      error: v('email'),
    }),
  notes: z.string().trim().optional(),
});

export type PrivateEventFormValues = z.infer<typeof privateEventSchema>;
export type PrivateEventFormInput = z.input<typeof privateEventSchema>;

export const editProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { error: v('required') })
    .max(60, { error: v('profileNameMax') }),
  bio: z
    .string()
    .trim()
    .max(160, { error: v('profileBioMax') }),
  memberSince: z
    .string()
    .trim()
    .min(1, { error: v('required') })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: v('invalidDate') })
    .refine(isValidCalendarDate, { error: v('invalidDate') }),
  nightsLeft: z
    .string()
    .trim()
    .min(1, { error: v('required') })
    .regex(/^[1-9]\d*$|^0$/, { error: v('number') }),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export const reviewSchema = z.object({
  rating: z.number().min(1, { error: v('required') }),
  comment: z
    .string()
    .trim()
    .max(500, { error: v('commentMax') })
    .optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

export const staffRewardAdjustmentSchema = z.object({
  billAmountVnd: z
    .string()
    .trim()
    .min(1, { error: v('required') })
    .regex(/^\d+$/, { error: v('number') })
    .refine(
      (value) =>
        Number.parseInt(value, 10) >= rewardConfig.cashbackSpendStepVnd,
      {
        error: v('loyaltyMinimumSpend'),
      }
    ),
  memberId: z
    .string()
    .trim()
    .min(1, { error: v('required') }),
  receiptReference: z
    .string()
    .trim()
    .min(1, { error: v('required') }),
});

export type StaffRewardAdjustmentFormValues = z.infer<
  typeof staffRewardAdjustmentSchema
>;

export const accountDeletionConfirmSchema = z.object({
  confirmation: z.literal('DELETE', {
    error: v('deleteConfirmation'),
  }),
});

export type AccountDeletionConfirmFormValues = z.infer<
  typeof accountDeletionConfirmSchema
>;
