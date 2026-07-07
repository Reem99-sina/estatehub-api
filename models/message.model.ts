import { Schema, model, Types } from "mongoose";
import { IMessage } from "../type/message";


const messageSchema = new Schema<IMessage>(
  {
      conversation: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

const Message = model<IMessage>("Message", messageSchema);

export default Message;