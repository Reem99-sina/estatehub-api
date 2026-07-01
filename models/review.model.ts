import { Schema, model, Types } from "mongoose";
import { IReview } from "../type/review";
import Property from "./property.model";
import { updatePropertyRating } from "../middleware/rating";


const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.post("save", async function () {
  await updatePropertyRating(this.property);
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  await updatePropertyRating(doc.property);
});

const Review = model<IReview>("Review", reviewSchema);

export default Review;