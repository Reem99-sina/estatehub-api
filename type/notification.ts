import { Types } from "mongoose";

export enum NotificationType {
  BOOKING = "Booking",
  INQUIRY = "Inquiry",
  MESSAGE = "Message",
  REVIEW = "Review",
  PROPERTY = "Property",
  SYSTEM = "System",
  PAYMENT = "Payment",
}

export interface INotification {
  user: Types.ObjectId;

  title: string;
  body: string;

  type: NotificationType;

  isRead: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}