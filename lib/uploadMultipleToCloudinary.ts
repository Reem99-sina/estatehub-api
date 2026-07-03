
import { Express } from "express";
import cloudinary from "./cloudinary";

export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder = "estatehub/properties",
): Promise<string[]> => {
  const uploads = files.map((file) => {
    return new Promise<string>((resolve, reject) => {
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
        },
      );

      stream.end(file.buffer);
    });
  });

  return Promise.all(uploads);
};