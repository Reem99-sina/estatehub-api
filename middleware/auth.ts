import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { UserRole } from "../type/user";

import User from "../models/user.model";
import { request } from "../type/express";

interface TokenPayload extends JsonWebTokenError {
  id: string;
}



export const auth =
  (accessRoles: UserRole[]) =>
  async (
    req: request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({ message: "Authorization header is required." });
        return;
      }

      const bearer = process.env.BEARER || "Bearer";

      if (!authHeader.startsWith(`${bearer} `)) {
        res.status(401).json({ message: "Invalid authorization header." });
        return;
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as TokenPayload;

      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      if (!accessRoles.includes(user.role)) {
        res.status(403).json({ message: "Access denied." });
        return;
      }

      req.user = user;

      next();
    } catch (error) {
      res.status(401).json({
        message: "Unauthorized.",
        error: error instanceof Error ? error.message : error,
      });
    }
  };