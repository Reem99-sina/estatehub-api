import { Types } from "mongoose";

export enum BookingStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

export interface IBooking {
  customer: Types.ObjectId;
  agent: Types.ObjectId;
  property: Types.ObjectId;
  rejectionReason: string;
  visitDate: Date;

  status: BookingStatus;

  note?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
