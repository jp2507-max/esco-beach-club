import { z } from 'zod';

import { loyaltyConfig } from '@/src/lib/loyalty';

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

export const signupSchema = emailAuthSchema;

export type SignupFormValues = z.infer<typeof signupSchema>;

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
    .refine(
      (value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value),
      {
        error: v('invalidDate'),
      }
    )
    .refine((value) => value.length === 0 || isValidCalendarDate(value), {
      error: v('invalidDate'),
    }),
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

export const staffLoyaltyAwardSchema = z
  .object({
    billAmountVnd: z
      .string()
      .trim()
      .min(1, { error: v('required') })
      .regex(/^\d+$/, { error: v('number') })
      .refine(
        (value) => Number.parseInt(value, 10) >= loyaltyConfig.spendStepVnd,
        {
          error: v('loyaltyMinimumSpend'),
        }
      ),
    managerPin: z.string().trim().optional(),
    memberId: z
      .string()
      .trim()
      .min(1, { error: v('required') }),
    receiptReference: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    const amountVnd = Number.parseInt(value.billAmountVnd, 10);

    if (
      Number.isFinite(amountVnd) &&
      amountVnd > loyaltyConfig.approvalCapVnd &&
      (!value.managerPin || value.managerPin.trim().length < 4)
    ) {
      context.addIssue({
        code: 'custom',
        message: v('loyaltyManagerPin'),
        path: ['managerPin'],
      });
    }
  });

export type StaffLoyaltyAwardFormValues = z.infer<
  typeof staffLoyaltyAwardSchema
>;
