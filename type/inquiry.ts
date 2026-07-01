import { Types } from "mongoose";

export enum InquiryStatus {
  PENDING = "Pending",
  ANSWERED = "Answered",
  CLOSED = "Closed",
}

export interface IInquiry {
  customer: Types.ObjectId;
  property: Types.ObjectId;

  message: string;

  status: InquiryStatus;

  createdAt?: Date;
  updatedAt?: Date;
}