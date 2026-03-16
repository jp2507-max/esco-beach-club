import { z } from 'zod';

const v = (key: string) => `common:validation.${key}` as const;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ error: v('email') }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { error: v('required') }),
});

export type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ error: v('email') }),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const privateEventSchema = z.object({
  eventType: z
    .string()
    .trim()
    .min(1, { error: v('required') }),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: v('invalidDate') })
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

export const reviewSchema = z.object({
  rating: z.number().min(1, { error: v('required') }),
  comment: z
    .string()
    .trim()
    .max(500, { error: v('commentMax') })
    .optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
