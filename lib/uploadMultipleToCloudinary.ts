
import { Express } from "express";
import cloudinary from "./cloudinary";

type UploadedImage = {
  url: string;
  public_id: string;
};

export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder = "estatehub/properties",
): Promise<UploadedImage[]> => {
  const uploads = files.map((file) => {
    return new Promise<UploadedImage>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload failed"));

          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      stream.end(file.buffer);
    });
  });

  return Promise.all(uploads);
};