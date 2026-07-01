import { z } from "zod";
import { UserRole } from "../type/user";
import { CategoryName } from "../type/category";
import { PropertyPurpose } from "../type/property";

export const signupSchema = z.object({
  name: z.string().trim().min(3).max(50),

  email: z.string().trim().email(),

  password: z.string().min(6).max(100),

  role: z.nativeEnum(UserRole).optional().default(UserRole.CUSTOMER),
});

export const signinSchema = z.object({
  email: z.string().trim().email(),

  password: z.string().min(6),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email(),

  code: z.number().min(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),

    code: z.string().trim().length(6, "Reset code must be 6 digits"),

    password: z.string().min(6, "Password must be at least 6 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const propertyIdSchema = z.object({
  propertyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid property id"),
});

export const preferencesSchema = z
  .object({
    cities: z.array(z.string().trim()).optional().default([]),

    propertyTypes: z.array(z.enum(CategoryName)).optional().default([]),

    purpose: z.enum(PropertyPurpose).optional(),

    minPrice: z.coerce.number().min(0).optional(),

    maxPrice: z.coerce.number().min(0).optional(),

    bedrooms: z.coerce.number().min(0).optional(),

    bathrooms: z.coerce.number().min(0).optional(),
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: "Minimum price must be less than or equal to maximum price",
      path: ["minPrice"],
    },
  );
