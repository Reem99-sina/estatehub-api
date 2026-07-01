import { Response } from "express";
import { request } from "../type/express";
import Booking from "../models/booking.model";
import { BookingStatus } from "../type/booking";
import Payment from "../models/payment.model";
import { PaymentStatus, PaymentType } from "../type/payment";
import { stripe } from "../lib/stripe";
import Stripe from "stripe";
import { createNotification } from "./notification.services";
import { NotificationType } from "../type/notification";
import { getIO } from "../lib/socket";
import subscriptionModel from "../models/subscription.model";
import { SubscriptionPlan, SubscriptionStatus } from "../type/subscription";

export const createBookingPayment = async (req: request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { amount, currency } = req.body;
    const booking = await Booking.findById(bookingId).populate("property");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    if (booking.customer.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }
    if (booking.status != BookingStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: "Booking is not completed yet",
      });
    }
    const payment = await Payment.create({
      user: req.user!._id,
      booking: booking._id,
      amount,
      currency: currency || "usd",
      type: PaymentType.BOOKING,
      status: PaymentStatus.PENDING,
      paymentMethod: "stripe",
    });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      line_items: [
        {
          quantity: 1,

          price_data: {
            currency: "usd",

            unit_amount: amount * 100,

            product_data: {
              name: "Booking Fee",
            },
          },
        },
      ],

      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,

      metadata: {
        paymentId: payment._id.toString(),
        bookingId: booking._id.toString(),
      },
    });

    payment.sessionId = session.id;
    await payment.save();

    return res.status(200).json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const createSubscriptionPayment = async (
  req: request,
  res: Response,
) => {
  try {
    const { plan } = req.body;

    const prices = {
      FREE: 0,
      PRO: 29,
      PREMIUM: 99,
    };

    if (!prices[plan as SubscriptionPlan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan.",
      });
    }

    const amount = prices[plan as SubscriptionPlan];

    const subscription = await subscriptionModel.create({
      agent: req.user!._id,
      plan,
      price: amount,
      startsAt: new Date(),
      expiresAt: new Date(), // Updated after payment
      status: SubscriptionStatus.ACTIVE,
    });

    const payment = await Payment.create({
      user: req.user!._id,
      subscription: subscription._id,
      amount,
      currency: "usd",
      paymentMethod: "stripe",
      type: PaymentType.SUBSCRIPTION,
      status: PaymentStatus.PENDING,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: {
              name: `${plan} Subscription`,
            },
          },
        },
      ],

      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,

      metadata: {
        paymentId: payment._id.toString(),
        subscriptionId: subscription._id.toString(),
      },
    });

    payment.sessionId = session.id;
    await payment.save();

    return res.status(200).json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const stripeWebhook = async (req: request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const payment = await Payment.findById(session.metadata?.paymentId);

        if (!payment) {
          return res.sendStatus(404);
        }
        if (payment.type === PaymentType.SUBSCRIPTION) {
          const subscription = await subscriptionModel.findById(
            payment.subscription,
          );

          if (subscription) {
            subscription.startsAt = new Date();

            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            subscription.expiresAt = expiresAt;
            subscription.status = SubscriptionStatus.ACTIVE;

            await subscription.save();

            await createNotification({
              user: subscription.agent.toString(),
              title: "Subscription Activated",
              body: `Your ${subscription.plan} plan is now active.`,
              type: NotificationType.PAYMENT,
            });
          }
        }
        // Prevent duplicate processing
        if (payment.status === PaymentStatus.SUCCEEDED) {
          return res.status(200).json({ received: true });
        }

        payment.status = PaymentStatus.SUCCEEDED;
        payment.transactionId = session.payment_intent?.toString();
        payment.paidAt = new Date();

        await payment.save();

        const booking = await Booking.findById(payment.booking).populate({
          path: "property",
          populate: {
            path: "owner",
          },
        });

        if (!booking) {
          return res.sendStatus(404);
        }

        booking.status = BookingStatus.COMPLETED;
        await booking.save();

        const customerNotification = await createNotification({
          user: booking.customer.toString(),
          title: "Payment Successful",
          body: "Your booking payment has been received.",
          type: NotificationType.PAYMENT,
        });

        const property: any = booking.property;

        await createNotification({
          user: property.owner._id.toString(),
          title: "Booking Paid",
          body: "A customer has completed payment for your property.",
          type: NotificationType.BOOKING,
        });

        const io = getIO();

        io.to(booking.customer.toString()).emit(
          "newNotification",
          customerNotification,
        );

        io.to(property.owner._id.toString()).emit("newNotification", {
          title: "Booking Paid",
          body: "A customer has completed payment for your property.",
        });

        break;
      }

      default:
        break;
    }

    return res.status(200).json({
      received: true,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export const getPaymentHistory = async (req: request, res: Response) => {
  try {
    const payments = await Payment.find({
      user: req.user!._id,
    })
      .populate({
        path: "booking",
        populate: {
          path: "property",
          select: "title location images",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getPaymentById = async (req: request, res: Response) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user!._id,
    }).populate({
      path: "booking",
      populate: {
        path: "property",
        select: "title location images",
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
