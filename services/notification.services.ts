import { Response } from "express";
import { request } from "../type/express";
import Notification from "../models/notification.model";
import { NotificationType } from "../type/notification";

export const getNotifications = async (req: request, res: Response) => {
  try {
    const notifications = await Notification.find({
      user: req.user?._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const markNotificationAsRead = async (req: request, res: Response) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user?._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    notification.isRead = true;
    notification.updatedAt = new Date();

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const markAllNotificationsAsRead = async (
  req: request,
  res: Response,
) => {
  try {
    await Notification.updateMany(
      {
        user: req.user?._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


interface CreateNotificationParams {
  user: string;
  title: string;
  body: string;
  type: NotificationType;
}

export const createNotification = async ({
  user,
  title,
  body,
  type,
}: CreateNotificationParams) => {
  return await Notification.create({
    user,
    title,
    body,
    type,
  });
};
