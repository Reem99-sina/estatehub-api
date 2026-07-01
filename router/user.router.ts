import { fileType, myMulter } from "../lib/multer";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  addRecentlyViewed,
  addToFavorites,
  forgotPassword,
  getAdminAnalytics,
  getAdminDashboard,
  getAgentDashboard,
  getFavorites,
  getMe,
  getPreferences,
  getRecentlyViewed,
  removeFromFavorites,
  resetPassword,
  signin,
  signup,
  updatePreferences,
  verifyEmail,
} from "../services/user.services";
import { UserRole } from "../type/user";
import {
  forgotPasswordSchema,
  propertyIdSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  verifyEmailSchema,
} from "../validations/user.validation";

import express from "express";
const router = express.Router();

router.post(
  "/signup",
  myMulter("avatars", fileType.IMAGE).single("avatar"),
  validate(signupSchema),
  signup,
);

router.post("/signin", validate(signinSchema), signin);

router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.post(
  "/favorites/:propertyId",
  auth(Object.values(UserRole)),
  validate(propertyIdSchema, "params"),
  addToFavorites,
);
router.delete(
  "/favorites/:propertyId",
  auth(Object.values(UserRole)),
  validate(propertyIdSchema, "params"),
  removeFromFavorites,
);
router.get("/favorites", auth(Object.values(UserRole)), getFavorites);

router.patch("/preferences", auth(Object.values(UserRole)), updatePreferences);
router.get("/preferences", auth(Object.values(UserRole)), getPreferences);

router.post(
  "/recently-viewed/:propertyId",
  auth(Object.values(UserRole)),
  validate(propertyIdSchema, "params"),
  addRecentlyViewed,
);

router.get(
  "/recently-viewed",
  auth(Object.values(UserRole)),
  getRecentlyViewed,
);

router.get("/me", auth(Object.values(UserRole)), getMe);
router.get(
  "/dashboard",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  getAdminDashboard,
);

router.get(
  "/analytics/admin",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  getAdminAnalytics,
);

router.get(
  "/analytics/agent",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  getAgentDashboard,
);

export default router;
