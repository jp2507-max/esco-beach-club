import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const verifyCodeSchema = z.object({
  code: z.string().trim().min(1),
});

export type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

export const signupSchema = z.object({
  email: z.string().trim().email(),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const privateEventSchema = z.object({
  eventType: z.string().trim().min(1),
  preferredDate: z.string().trim().min(1),
  estimatedPax: z
    .string()
    .trim()
    .regex(/^\d+$/, { error: 'validation.number' })
    .refine((value) => Number.parseInt(value, 10) > 0, {
      error: 'validation.positiveNumber',
    }),
  contactName: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.email().safeParse(value).success, {
      error: 'validation.email',
    }),
  notes: z.string().trim().optional(),
});

export type PrivateEventFormValues = z.infer<typeof privateEventSchema>;

export const reviewSchema = z.object({
  rating: z.number().min(1),
  comment: z.string().trim().max(500).optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
