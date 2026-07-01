import { Schema, model } from "mongoose";
import {
  ISubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../type/subscription";

const subscriptionSchema = new Schema<ISubscription>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    startsAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ agent: 1, status: 1 });

export default model<ISubscription>(
  "Subscription",
  subscriptionSchema
);