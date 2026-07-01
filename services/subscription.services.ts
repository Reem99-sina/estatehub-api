import { Response } from "express";
import { request } from "../type/express";
import { SUBSCRIPTION_PLANS, SubscriptionStatus } from "../type/subscription";
import { createSubscriptionPayment } from "./payment.services";
import subscriptionModel from "../models/subscription.model";

export const getPlans = async (
  req: request,
  res: Response
) => {

  return res.json({
    success: true,
    data: SUBSCRIPTION_PLANS,
  });

};

export const subscribe = async (
  req: request,
  res: Response
) => {

  return createSubscriptionPayment(req, res);

};


export const getMySubscription = async (
  req: request,
  res: Response
) => {

  const subscription = await subscriptionModel.findOne({
    agent: req.user!._id,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "No active subscription found.",
    });
  }

  return res.json({
    success: true,
    data: subscription,
  });

};

export const cancelSubscription = async (
  req: request,
  res: Response
) => {

  const subscription = await subscriptionModel.findOne({
    agent: req.user!._id,
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Subscription not found.",
    });
  }

  subscription.status = SubscriptionStatus.CANCELED;

  await subscription.save();

  return res.json({
    success: true,
    message: "Subscription cancelled successfully.",
  });

};