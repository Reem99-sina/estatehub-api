import { z } from "zod";
import { Types } from "mongoose";

const objectId = z.string().refine((value) => Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

export const notificationIdSchema = z.object({
  id: objectId,
});
