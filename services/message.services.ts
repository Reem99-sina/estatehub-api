import { Response } from "express";
import { request } from "../type/express";

import { NotificationType } from "../type/notification";
import Message from "../models/message.model";
import Notification from "../models/notification.model";
import { getIO } from "../lib/socket";
import User from "../models/user.model";
import mongoose from "mongoose";
import conversationModel from "../models/conversation.model";

export const messageAdd = async (req: request, res: Response) => {
  try {
    const sender = req.user!._id;
    const { receiver, property, message } = req.body;

    let conversation = await conversationModel.findOne({
      participants: {
        $all: [sender, receiver],
      },
    });

    if (!conversation) {
      conversation = await conversationModel.create({
        participants: [sender, receiver],
      });
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender,
      receiver,
      property,
      message,
    });

    conversation.lastMessage = newMessage._id;
    conversation.lastMessageText = message;
    conversation.lastMessageAt = newMessage.createdAt;

    await conversation.save();
    const io = getIO();

    io.to(receiver.toString()).emit("newMessage", newMessage);
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
    const conversation = await conversationModel.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .populate("sender", "name email avatar isOnline")
      .populate("receiver", "name email avatar isOnline")
      .populate("property", "title images")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages?.map((ele) => !ele?.isRead)?.length,
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
    const conversations = await conversationModel
      .find({
        participants: currentUser,
      })
      .populate("participants", "name email avatar isOnline")
      .populate({
        path: "lastMessage",
        populate: [
          {
            path: "sender",
            select: "name email avatar isOnline",
          },
          {
            path: "receiver",
            select: "name email avatar isOnline",
          },
          {
            path: "property",
            select: "title images",
          },
        ],
      })
      .sort({
        lastMessageAt: -1,
      });
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
