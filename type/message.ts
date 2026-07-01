import { Types } from "mongoose";

export interface IMessage {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  property?: Types.ObjectId;

  message: string;

  isRead: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}