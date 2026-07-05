import express from "express";
import { auth } from "../middleware/auth";
import { UserRole } from "../type/user";
import {
  getConversation,
  getConversationUserId,
  getUnreadCount,
  markMessageAsRead,
  messageAdd,
} from "../services/message.services";
import { validate } from "../middleware/validate";
import {
  conversationSchema,
  createMessageSchema,
  markMessageAsReadSchema,
} from "../validations/message.validation";
const router = express.Router();

router.post(
  "/",
  auth(Object.values(UserRole)),
  validate(createMessageSchema),
  messageAdd,
);
router.get("/unread/count", auth(Object.values(UserRole)), getUnreadCount);
router.get(
  "/:userId",
  auth(Object.values(UserRole)),
  validate(conversationSchema, "params"),
  getConversation,
);
router.patch(
  "/:id/read",
  auth(Object.values(UserRole)),
  validate(markMessageAsReadSchema, "params"),
  markMessageAsRead,
);

router.get("/conversation",auth(Object.values(UserRole)),getConversationUserId)

export default router;
