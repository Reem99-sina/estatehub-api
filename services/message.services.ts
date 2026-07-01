import { Response } from "express";
import { request } from "../type/express";

import { NotificationType } from "../type/notification";
import Message from "../models/message.model";
import Notification from "../models/notification.model";
import { getIO } from "../lib/socket";

export const messageAdd = async (req: request, res: Response) => {
  try {
    const sender = req.user?._id;
    const { receiver, property, message } = req.body;

    if (!receiver || !message) {
      return res.status(400).json({
        success: false,
        message: "Receiver and message are required.",
      });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      property,
      message,
    });
    const io = getIO();

    io.to(receiver.toString()).emit("newMessage", newMessage);
    // Create notification for the receiver
    const notification = await Notification.create({
      user: receiver,
      title: "New Message",
      body: `${req.user?.name} sent you a message.`,
      type: NotificationType.MESSAGE,
    });
    io.to(receiver.toString()).emit("newNotification", notification);
    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: newMessage,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const getConversation = async (req: request, res: Response) => {
  try {
    const currentUser = req.user?._id;
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        {
          sender: currentUser,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: currentUser,
        },
      ],
    })
      .populate("sender", "name email avatar")
      .populate("receiver", "name email avatar")
      .populate("property", "title images")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const markMessageAsRead = async (req: request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    message.isRead = true;
    message.updatedAt = new Date();

    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message marked as read.",
      data: message,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const getUnreadCount = async (req: request, res: Response) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user?._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unread: count,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
