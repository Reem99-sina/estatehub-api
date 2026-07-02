import mongoose from "mongoose";
import Review from "../models/review.model";
import Property from "../models/property.model";

export const updatePropertyRating = async (
  propertyId: mongoose.Types.ObjectId,
) => {
  const stats = await Review.aggregate([
    {
      $match: {
        property: propertyId,
      },
    },
    {
      $group: {
        _id: "$property",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (!stats.length) {
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: 0,
      totalReviews: 0,
      featured: false,
    });

    return;
  }

  const averageRating = Number(stats[0].averageRating.toFixed(1));
  const totalReviews = stats[0].totalReviews;

  await Property.findByIdAndUpdate(propertyId, {
    averageRating,
    totalReviews,
    featured: averageRating >= 4.8,
  });
};
