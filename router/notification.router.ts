import express from "express";
import { auth } from "../middleware/auth";
import { UserRole } from "../type/user";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.services";
import { notificationIdSchema } from "../validations/noticaton.validation";
import { validate } from "../middleware/validate";

const router = express.Router();

router.get("/", auth(Object.values(UserRole)), getNotifications);

router.patch(
  "/:id/read",
  auth(Object.values(UserRole)),
  validate(notificationIdSchema),
  markNotificationAsRead,
);

router.patch(
  "/read-all",
  auth(Object.values(UserRole)),
  markAllNotificationsAsRead,
);

export default router;
