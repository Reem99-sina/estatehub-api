import { Response } from "express";
import { request } from "../type/express";
import Review from "../models/review.model";

export const addReview = async (req: request, res: Response) => {
  const { property, rating, comment } = req.body;

  const exists = await Review.findOne({
    property,
    user: req.user?._id,
  });

  if (exists) {
    return res.status(400).json({
      success: false,
      message: "You have already reviewed this property.",
    });
  }

  const review = await Review.create({
    property,
    user: req.user?._id,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    data: review,
  });
};

export const getPropertyReviews = async (req: request, res: Response) => {
  const reviews = await Review.find({
    property: req.params.propertyId,
  })
    .populate("user", "name avatar")
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
};

export const updateReview = async (req: request, res: Response) => {
  const review = await Review.findOne({
    _id: req.params.id,
    user: req.user?._id,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review not found.",
    });
  }

  review.rating = req.body.rating;
  review.comment = req.body.comment;

  await review.save();

  res.json({
    success: true,
    data: review,
  });
};

export const deleteReview = async (req: request, res: Response) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.id,
    user: req.user?._id,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review not found.",
    });
  }

  res.json({
    success: true,
    message: "Review deleted successfully.",
  });
};
