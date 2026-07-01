import { Types } from "mongoose";

export interface IReview {
  user: Types.ObjectId;
  property: Types.ObjectId;
  rating: number;
  comment: string;

  createdAt?: Date;
  updatedAt?: Date;
}