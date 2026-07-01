import { z } from "zod";
import { SubscriptionPlan } from "../type/subscription";

export const subscribeSchema = z.object({

    plan: z.nativeEnum(SubscriptionPlan),
  
});