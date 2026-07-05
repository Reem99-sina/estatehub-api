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

    socket.on("typing", ({ receiverId }: { receiverId: string }) => {
      socket.to(receiverId).emit("typing");
    });

    socket.on("stopTyping", ({ receiverId }: { receiverId: string }) => {
      socket.to(receiverId).emit("stopTyping");
    });

    socket.on("sendMessage", async (data) => {
      const message = await Message.create(data);

      io.to(data.receiverId).emit("receiveMessage", message);

      socket.emit("receiveMessage", message);
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
