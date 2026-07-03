import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import Routercollection from "./router/main.router";
import { connectdb } from "./config/connectbd";
import path from "path";
import { responseHandler } from "./lib/response";
import { seedCategories } from "./services/category.services";
import { initSocket } from "./lib/socket";

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(responseHandler);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Routes
app.get("/", (req: Request, res: Response) => {
  res.json("Welcome");
});
app.use("/user", Routercollection.userRouter);
app.use("/property", Routercollection.propertyRouter);
app.use("/booking", Routercollection.bookingRouter);
app.use("/message", Routercollection.messageRouter);
app.use("/notification", Routercollection.notifcationRouter);
app.use("/review", Routercollection.reviewRouter);
app.use("/payment", Routercollection.paymentRouter);
app.use("/subscription", Routercollection.subscriptionRouter);
app.use("/category", Routercollection.categoryRouter);

// Database
connectdb().then(() => {
  seedCategories();
});

// Server
const PORT: number = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

initSocket(server);
