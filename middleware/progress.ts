import { NextFunction, Request, Response } from "express";

export const parseFormData = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.body.location) {
    req.body.location = JSON.parse(req.body.location);
  }
//   if (req.body.purpose) {
//     req.body.purpose = JSON.parse(req.body.purpose);
//   }

//   if (req.body.amenities) {
//     req.body.amenities = JSON.parse(req.body.amenities);
//   }

  next();
};
