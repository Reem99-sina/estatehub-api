import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "params" | "query";

export const validate =
  <T>(schema: ZodSchema<T>, source: Source = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.error.issues,
      });
      return;
    }

    req[source] = result.data as any;

    next();
  };