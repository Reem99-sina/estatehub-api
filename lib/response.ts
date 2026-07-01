import { Request, Response, NextFunction } from "express";

interface CustomResponse extends Response {
  success: (
    message: string,
    data?: unknown,
    status?: number,
  ) => Response;

  error: (
    message: string,
    errors?: unknown,
    status?: number,
  ) => Response;
}

export const responseHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const response = res as CustomResponse;

  response.success = (
    message: string,
    data: unknown = null,
    status: number = 200,
  ) => {
    return response.status(status).json({
      success: true,
      message,
      data,
    });
  };

  response.error = (
    message: string,
    errors: unknown = null,
    status: number = 400,
  ) => {
    return response.status(status).json({
      success: false,
      message,
      errors,
    });
  };

  next();
};