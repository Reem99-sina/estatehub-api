import express from "express";
import { auth } from "../middleware/auth";
import { UserRole } from "../type/user";
import {
  createBookingPayment,
  createSubscriptionPayment,
  stripeWebhook,
  getPaymentHistory,
  getPaymentById,
} from "../services/payment.services";
import { validate } from "../middleware/validate";
import { paymentIdSchema } from "../validations/payment.validation";

const router = express.Router();

/**
 * Booking Payment
 */
router.post(
  "/booking/:bookingId",
  auth([UserRole.CUSTOMER]),
  createBookingPayment,
);

/**
 * Agent Subscription
 */
router.post(
  "/subscription",
  auth([UserRole.AGENT, UserRole.ADMIN]),
  createSubscriptionPayment,
);

/**
 * Stripe Webhook
 * IMPORTANT: No auth middleware here.
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

/**
 * Logged-in user's payment history
 */
router.get("/history", auth(Object.values(UserRole)), getPaymentHistory);

/**
 * Get payment details
 */
router.get(
  "/:id",
  auth(Object.values(UserRole)),
  validate(paymentIdSchema, "params"),
  getPaymentById,
);

export default router;
