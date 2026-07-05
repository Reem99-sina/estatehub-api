import { Response } from "express";
import { request } from "../type/express";

import { NotificationType } from "../type/notification";
import Message from "../models/message.model";
import Notification from "../models/notification.model";
import { getIO } from "../lib/socket";
import User from "../models/user.model";
import mongoose from "mongoose";

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
    console.log(error);

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
    console.log(error);

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
    console.log(error);

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
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const getConversationUserId = async (req: request, res: Response) => {
  try {
    const currentUser = req.user?._id;
    const existUser = await User.findById(currentUser);
    if (!existUser) {
      return res.status(404).json({
        success: false,
        message: "user not found.",
      });
    }
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUser) },
            { receiver: new mongoose.Types.ObjectId(currentUser) },
          ],
        },
      },

      // Create a unique conversation key regardless of sender/receiver order
      {
        $addFields: {
          conversationKey: {
            $cond: [
              { $lt: ["$sender", "$receiver"] },
              {
                $concat: [
                  { $toString: "$sender" },
                  "_",
                  { $toString: "$receiver" },
                ],
              },
              {
                $concat: [
                  { $toString: "$receiver" },
                  "_",
                  { $toString: "$sender" },
                ],
              },
            ],
          },
        },
      },

      // Latest message first
      {
        $sort: {
          createdAt: -1,
        },
      },

      // Group messages by conversation
      {
        $group: {
          _id: "$conversationKey",

          lastMessage: {
            $first: "$$ROOT",
          },

          messages: {
            $push: "$$ROOT",
          },
        },
      },

      // Populate sender
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.sender",
          foreignField: "_id",
          as: "sender",
        },
      },

      // Populate receiver
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.receiver",
          foreignField: "_id",
          as: "receiver",
        },
      },

      {
        $unwind: "$sender",
      },

      {
        $unwind: "$receiver",
      },

      {
        $project: {
          _id: 0,
          sender: 1,
          receiver: 1,
          lastMessage: 1,
          messages: 1,
        },
      },
    ]);
     return res.status(200).json({
      success: true,
      conversations: conversations,
    });
   } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
