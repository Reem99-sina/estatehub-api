import express from "express";
import { auth } from "../middleware/auth";
import { UserRole } from "../type/user";
import {
  getPlans,
  subscribe,
  getMySubscription,
  cancelSubscription,
} from "../services/subscription.services";
import { validate } from "../middleware/validate";
import { subscribeSchema } from "../validations/subscription.validation";

const router = express.Router();

router.get("/plans", getPlans);

router.post("/", auth([UserRole.AGENT]), validate(subscribeSchema), subscribe);

router.get("/me", auth([UserRole.AGENT]), getMySubscription);

router.patch("/cancel", auth([UserRole.AGENT]), cancelSubscription);

export default router;
