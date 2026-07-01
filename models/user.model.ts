import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserRole } from "../type/user";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    blocked: {
      type: Boolean,
      default: false,
    },

    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    recentlyViewed: [
      {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    preferences: {
      cities: {
        type: [String],
        default: [],
      },

      propertyTypes: {
        type: [String],
        default: [],
      },

      minPrice: Number,

      maxPrice: Number,

      bedrooms: Number,
    },

    refreshToken: String,

    verifyCode: String,

    resetPasswordCode: String,

    socketId: String,
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: Date,
  },
  {
    timestamps: true,
    versionKey: "__v",
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(process.env.SALTSOFROUND),
  );
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const doc = await this.model.findOne(this.getQuery()).select("__v");

  if (doc) {
    this.set({ __v: doc.__v + 1 });
  }
});

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
