import { Document, Types } from "mongoose";

export enum PaymentType {
  BOOKING = "BOOKING",
  SUBSCRIPTION = "SUBSCRIPTION",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface IPayment extends Document {
  user: Types.ObjectId;
subscription?: Types.ObjectId;
  booking?: Types.ObjectId;

  amount: number;

  currency: string;

  paymentMethod: string;

  transactionId?: string;

  sessionId?: string;

  type: PaymentType;

  status: PaymentStatus;

  paidAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}