import mongoose, { Schema, Document, Model } from "mongoose";
import { IProperty, PropertyPurpose, PropertyStatus } from "../type/property";

const propertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: Object.values(PropertyPurpose),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(PropertyStatus),
      default: PropertyStatus.AVAILABLE,
    },

    price: {
      type: Number,
      required: true,
    },

    area: {
      type: Number,
      required: true,
    },

    bedrooms: {
      type: Number,
      default: 0,
    },

    bathrooms: {
      type: Number,
      default: 0,
    },

    floor: Number,

    yearBuilt: Number,

    city: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    priceHistory: [
      {
        price: {
          type: Number,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: false,
        },
      },
    ],

    amenities: [
      {
        type: String,
      },
    ],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },

    viewsCount: {
      type: Number,
      default: 0,
    },

    favoritesCount: {
      type: Number,
      default: 0,
    },

    bookingsCount: {
      type: Number,
      default: 0,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

propertySchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  if (!update?.price) return;

  const property = await this.model.findOne(this.getQuery());

  if (!property) return;

  if (property.price !== update.price) {
    update.$push = {
      ...(update.$push || {}),
      priceHistory: {
        price: property.price,
        changedAt: new Date(),
      },
    };
  }
});
const Property: Model<IProperty> = mongoose.model<IProperty>(
  "Property",
  propertySchema,
);

export default Property;
