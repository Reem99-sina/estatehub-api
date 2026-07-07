import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageText?: string;
  lastMessageAt?: Date;
  unreadCount: {
    user: mongoose.Types.ObjectId;
    count: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageText: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    unreadCount: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ participants: 1 });

export default mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);