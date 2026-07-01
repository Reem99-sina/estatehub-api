import { z } from "zod";
import { Types } from "mongoose";

const objectId = z.string().refine((value) => Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

export const createReviewSchema = z.object({
  property: objectId,

  rating: z.number().min(1).max(5),

  comment: z.string().trim().min(5).max(500),
});

export const reviewIdSchema = z.object({
  id: objectId,
});
