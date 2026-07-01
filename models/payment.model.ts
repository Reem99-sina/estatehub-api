import { Schema, model } from "mongoose";
import { IPayment, PaymentStatus, PaymentType } from "../type/payment";


const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
subscription: {
    type: Schema.Types.ObjectId,
    ref: "Subscription",
    default: null,
},
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true,
    },

    paymentMethod: {
      type: String,
      default: "stripe",
    },

    transactionId: {
      type: String,
      default: null,
      index: true,
    },

    sessionId: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });

const Payment = model<IPayment>("Payment", paymentSchema);

export default Payment;