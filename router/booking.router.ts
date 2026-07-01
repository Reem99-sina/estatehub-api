import express from "express";
import { createBooking, deleteBooking, getAgentCalendar, getMyBookings, getPropertyBookings, updateBookingStatus } from "../services/booking.services";
import { auth } from "../middleware/auth";
import { UserRole } from "../type/user";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../validations/booking.validation";
const router = express.Router();
router.post(
  "/",
  auth(Object.values(UserRole)),
  validate(createBookingSchema),
  createBooking,
);

router.patch(
  "/:bookingId/status",
  auth([UserRole.ADMIN, UserRole.AGENT]),
//   validate(createBookingSchema),
  updateBookingStatus,
);

router.get(
  "/agent/calendar",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  getAgentCalendar,
);

router.get(
  "/bookings",
  auth(Object.values(UserRole)),
  getMyBookings,
);

router.get(
  "/:propertyId/bookings",
  auth(Object.values(UserRole)),
  getPropertyBookings,
);

router.delete(
  "/:bookingId",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  deleteBooking,
);

export default router;
