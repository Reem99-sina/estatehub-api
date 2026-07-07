import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import Message from "../models/message.model";
import User from "../models/user.model";
import dotenv from "dotenv";

let io: Server;
dotenv.config();
export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    const userId = socket.handshake.query.userId as string;

    if (userId) {
      socket.join(userId);
      updateUserStatus(userId, true);
    }

    socket.on("join", (userId: string) => {
      socket.join(userId);
    });

    socket.on("typing", ({ receiverId }) => {
      console.log("✅ typing received");
      console.log("receiverId =", receiverId);

      socket.to(receiverId).emit("typing");
    });

    socket.on("stopTyping", ({ receiverId }: { receiverId: string }) => {
      socket.to(receiverId).emit("stopTyping");
    });

    socket.on("sendMessage", async ({ receiverId, message }) => {
      try {
        const sender = socket.handshake.query.userId as string;

        const newMessage = await Message.create({
          sender,
          receiver: receiverId,
          message,
        });

        io.to(receiverId).emit("receiveMessage", newMessage);
        socket.emit("receiveMessage", newMessage);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on(
      "messageRead",
      async ({
        messageId,
        senderId,
      }: {
        messageId: string;
        senderId: string;
      }) => {
        console.log(senderId,messageId,'s')
        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date(),
        });

        io.to(senderId).emit("messageRead", {
          messageId,
        });
      },
    );

    socket.on("disconnect", async () => {
      console.log(`❌ Disconnected: ${socket.id}`);

      if (userId) {
        await updateUserStatus(userId, false);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized.");
  }

  return io;
};

async function updateUserStatus(userId: string, online: boolean) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: online,
      lastSeen: new Date(),
    });
  } catch (error) {
    console.log(error);
  }
}
