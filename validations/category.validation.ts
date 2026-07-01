import { z } from "zod";
import { Types } from "mongoose";

const objectId = z.string().refine(
  (id) => Types.ObjectId.isValid(id),
  {
    message: "Invalid category id",
  }
);

export const createCategorySchema = z.object({
  
    name: z.string().trim().min(2).max(50),

});
export const categoryIdSchema = z.object({
  id: objectId,
});
