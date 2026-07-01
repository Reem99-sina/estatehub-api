import { z } from "zod";
import { Types } from "mongoose";

const objectId = z.string().refine((value) => Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

export const createMessageSchema = z.object({
  receiver: objectId,

  property: objectId.optional(),

  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(1000, "Message cannot exceed 1000 characters"),
});

export const conversationSchema = z.object({
  userId: objectId,
});

export const markMessageAsReadSchema = z.object({
  id: objectId,
});
