import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectdb = async (): Promise<void> => {
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      throw new Error("DATABASE_URL is not defined in .env");
    }

    await mongoose.connect(dbUrl);

    console.log("✅ MongoDB connected");
  } catch (error) {
    
    process.exit(1);
  }
};