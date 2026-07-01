import { z } from "zod";

export const createBookingSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid property id"),

  visitDate: z
    .coerce
    .date()
    .refine(
      (date) => date > new Date(),
      {
        message: "Visit date must be in the future.",
      },
    ),

  note: z
    .string()
    .trim()
    .max(500, "Note must not exceed 500 characters")
    .optional(),
});