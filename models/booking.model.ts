import { Schema, model, Types } from "mongoose";
import { BookingStatus, IBooking } from "../type/booking";


const bookingSchema = new Schema<IBooking>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
  agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },

 

    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },

    note: String,

    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ property: 1, visitDate: 1 });
bookingSchema.index({ status: 1 });

const Booking = model<IBooking>("Booking", bookingSchema);

export default Booking;