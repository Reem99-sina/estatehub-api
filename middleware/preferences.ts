// middleware/updateSearchPreferences.ts

import { NextFunction, Response } from "express";
import { request } from "../type/express";
import User from "../models/user.model";


export const updateSearchPreferences = async (
  req: request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next();

    const { city, category, minPrice, maxPrice, bedrooms } = req.query;

    const update: any = {};
    const addToSet: any = {};
    const set: any = {};

    if (city) {
      addToSet["preferences.cities"] = city;
    }

    if (category) {
      addToSet["preferences.propertyTypes"] = category;
    }

    if (minPrice) {
      set["preferences.minPrice"] = Number(minPrice);
    }

    if (maxPrice) {
      set["preferences.maxPrice"] = Number(maxPrice);
    }

    if (bedrooms) {
      set["preferences.bedrooms"] = Number(bedrooms);
    }

    if (Object.keys(addToSet).length) {
      update.$addToSet = addToSet;
    }

    if (Object.keys(set).length) {
      update.$set = set;
    }

    if (Object.keys(update).length) {
      await User.findByIdAndUpdate(req.user._id, update);
    }

    next();
  } catch (error) {
    next(error);
  }
};