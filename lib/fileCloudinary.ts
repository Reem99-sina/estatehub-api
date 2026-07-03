
import { Express } from "express";
import cloudinary from "./cloudinary";

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder = "estatehub"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result) {
          return reject(new Error("Upload failed"));
        }

        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};