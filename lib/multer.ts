import multer from "multer";
import path from "path";
import fs from "fs";

export const fileType = {
  IMAGE: ["image/jpeg", "image/jpg", "image/png"],
};

export const myMulter = (
  customPath = "general",
  customValid: string[],
) => {
  const fullPath = path.join(process.cwd(), "uploads", customPath);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      req.body.destination = `uploads/${customPath}`;
      cb(null, fullPath);
    },

    filename(req, file, cb) {
      cb(null, `${new Date().getTime()}-${file.originalname}`);
    },
  });

  const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
    if (customValid.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
    },
  });
};