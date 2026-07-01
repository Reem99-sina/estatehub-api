import { Document, Types } from "mongoose";

export enum SubscriptionPlan {
  FREE = "FREE",
  PRO = "PRO",
  PREMIUM = "PREMIUM",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELED = "CANCELED",
}

export interface ISubscription extends Document {
  agent: Types.ObjectId;
  plan: SubscriptionPlan;
  price: number;
  startsAt: Date;
  expiresAt: Date;
  status: SubscriptionStatus;
}

export const SUBSCRIPTION_PLANS = {
  FREE: {
    price: 0,
    duration: 30,
    maxProperties: 5,
  },

  PRO: {
    price: 29,
    duration: 30,
    maxProperties: 50,
  },

  PREMIUM: {
    price: 99,
    duration: 30,
    maxProperties: -1,
  },
};