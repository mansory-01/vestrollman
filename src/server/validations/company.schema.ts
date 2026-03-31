import { z } from "zod";

export const providerPreferenceSchema = z.enum(["monnify", "flutterwave"]);

const nullableTrimmedString = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional();

export const updateCompanyProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    industry: nullableTrimmedString,
    registrationNumber: nullableTrimmedString,
    providerPreference: providerPreferenceSchema.optional(),
    registered: z
      .object({
        street: nullableTrimmedString,
        city: nullableTrimmedString,
        state: nullableTrimmedString,
        postalCode: nullableTrimmedString,
        country: nullableTrimmedString,
      })
      .optional(),
    billing: z
      .object({
        street: nullableTrimmedString,
        city: nullableTrimmedString,
        state: nullableTrimmedString,
        postalCode: nullableTrimmedString,
        country: nullableTrimmedString,
      })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;