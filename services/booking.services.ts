import { Response } from "express";
import { request } from "../type/express";
import Property from "../models/property.model";
import Booking from "../models/booking.model";
import { BookingStatus } from "../type/booking";
import { createNotification } from "./notification.services";
import { NotificationType } from "../type/notification";

export const createBooking = async (req: request, res: Response) => {
  try {
    const { visitDate, note, propertyId } = req.body;
    if (new Date(visitDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Visit date must be in the future.",
      });
    }
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (!property.isApproved) {
      return res.status(400).json({
        success: false,
        message: "This property is not available for booking.",
      });
    }

    // Owner can't book his own property
    if (property.owner.toString() === req.user!._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own property.",
      });
    }

    // Prevent duplicate booking for the same time
    const exists = await Booking.findOne({
      property: propertyId,
      visitDate: new Date(visitDate),
      status: {
        $in: [BookingStatus.PENDING, BookingStatus.APPROVED],
      },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "This visit time is already booked.",
      });
    }
    const alreadyBooked = await Booking.findOne({
      customer: req.user!._id,
      property: propertyId,
      status: {
        $in: [BookingStatus.PENDING, BookingStatus.APPROVED],
      },
    });

    if (alreadyBooked) {
      return res.status(409).json({
        success: false,
        message: "You already have an active booking for this property.",
      });
    }
    const booking = await Booking.create({
      customer: req.user!._id,
      property: property?._id,
      agent: property.owner,
      visitDate,
      note,
    });

    await Property.findByIdAndUpdate(propertyId, {
      $inc: {
        bookingsCount: 1,
      },
    });

    await booking.populate([
      {
        path: "property",
      },
      {
        path: "customer",
      },
      {
        path: "agent",
      },
    ]);
    await createNotification({
      user: property.owner.toString(), // Agent
      title: "New Booking Request",
      body: `${req.user?.name} requested a visit for "${property.title}".`,
      type: NotificationType.BOOKING,
    });
    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      data: booking,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBookingStatus = async (req: request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId).populate("property");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    
    const property = booking.property as any;

    if (!Object.values(BookingStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    booking.status = status;

    await booking.save();
    if (status == BookingStatus.APPROVED) {
      await createNotification({
        user: booking.customer.toString(),
        title: "Booking Approved",
        body: `Your booking for "${property.title}" has been approved.`,
        type: NotificationType.BOOKING,
      });
    }
    if (status == BookingStatus.REJECTED) {
      await createNotification({
        user: booking.customer.toString(),
        title: "Booking Rejected",
        body: `Unfortunately, your booking for "${property.title}" was rejected.`,
        type: NotificationType.BOOKING,
      });
    }
    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully.`,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAgentCalendar = async (req: request, res: Response) => {
  try {
    const bookings = await Booking.find({
      agent: req.user!._id,
    })
      .populate("customer", "name email avatar")
      .populate("property")
      .sort({
        visitDate: 1,
      });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyBookings = async (req: request, res: Response) => {
  try {
    const bookings = await Booking.find({
      customer: req.user!._id,
    })
      .populate("property")
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPropertyBookings = async (req: request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const bookings = await Booking.find({
      property: propertyId,
    })
      .populate("customer")
      .sort({
        visitDate: 1,
      });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBooking = async (req: request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate("property");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isCustomer = booking.customer.toString() === req.user!._id.toString();

    const isAgent = booking.agent.toString() === req.user!._id.toString();

    if (!isCustomer && !isAgent) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this booking.",
      });
    }

    await Booking.findByIdAndDelete(bookingId);

    await Property.findByIdAndUpdate(booking.property, {
      $inc: {
        bookingsCount: -1,
      },
    });

    return res.json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
