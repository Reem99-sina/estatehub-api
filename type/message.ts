import { Types } from "mongoose";

export interface IMessage {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  property?: Types.ObjectId;

  message: string;

  isRead: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
