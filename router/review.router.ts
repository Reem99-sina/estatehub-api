import express from "express";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  addReview,
  deleteReview,
  getPropertyReviews,
  updateReview,
} from "../services/review.services";
import { UserRole } from "../type/user";
import {
  createReviewSchema,
  reviewIdSchema,
} from "../validations/review.validation";
const router = express.Router();

router.post(
  "/",
  auth([UserRole.CUSTOMER]),
  validate(createReviewSchema),
  addReview,
);

router.get("/property/:propertyId", getPropertyReviews);

router.patch(
  "/:id",
  auth([UserRole.CUSTOMER]),
  validate(reviewIdSchema, "params"),
  updateReview,
);

router.delete(
  "/:id",
  auth([UserRole.CUSTOMER]),
  validate(reviewIdSchema, "params"),
  deleteReview,
);

export default router;
