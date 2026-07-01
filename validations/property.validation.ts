import { z } from "zod";
import {
  PropertyPurpose,
  PropertyStatus,
} from "../type/property";

export const addPropertySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),

  purpose: z.enum(PropertyPurpose),

  status: z
    .enum(PropertyStatus)
    .optional()
    .default(PropertyStatus.AVAILABLE),

  price: z.coerce
    .number()
    .positive("Price must be greater than 0"),

  area: z.coerce
    .number()
    .positive("Area must be greater than 0"),

  bedrooms: z.coerce
    .number()
    .min(0)
    .optional()
    .default(0),

  bathrooms: z.coerce
    .number()
    .min(0)
    .optional()
    .default(0),

  floor: z.coerce
    .number()
    .min(0)
    .optional(),

  yearBuilt: z.coerce
    .number()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),

  city: z
    .string()
    .trim()
    .min(2, "City is required"),

  address: z
    .string()
    .trim()
    .min(5, "Address is required"),

  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid category id"),

  amenities: z
    .array(z.string())
    .optional()
    .default([]),

  location: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
  }),
});

export const updatePropertySchema =
  addPropertySchema.partial();
