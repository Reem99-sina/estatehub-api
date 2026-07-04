import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { generateCode, sendVerificationEmail } from "../lib/mailer";
import { request } from "../type/express";
import Property from "../models/property.model";
import { PaymentStatus } from "../type/payment";
import Payment from "../models/payment.model";
import { PropertyStatus } from "../type/property";
import Booking from "../models/booking.model";
import { UserRole } from "../type/user";
import Message from "../models/message.model";
import { BookingStatus } from "../type/booking";
import fs from "fs";
import { uploadToCloudinary } from "../lib/fileCloudinary";

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    // const avatar = req.file ? `uploads/avatars/${req.file.filename}` : "";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Delete uploaded avatar

      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      const code = generateCode();

      existingUser.verifyCode = code;
      existingUser.isVerified = false;

      await existingUser.save();

      await sendVerificationEmail(existingUser.email, code);

      return res.status(200).json({
        success: true,
        needVerify: true,
        email: existingUser.email,
        message:
          "Your account already exists but isn't verified. We've sent a new verification code.",
      });
    }

    const code = generateCode();
    let avatar = "";

    if (req.file) {
      avatar = await uploadToCloudinary(req.file, "estatehub/avatars");
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      avatar,
      verifyCode: code,
      isVerified: false,
    });
    await sendVerificationEmail(user.email, code);

    return res.status(201).json({
      success: true,
      needVerify: true,
      email: user.email,
      message: "User created successfully. Please verify your email.",
    });
  } catch (error: any) {
    // Delete uploaded file if something failed after upload
    if (req.file) {
      await fs.unlink(req.file.path, () => {});
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.blocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
    }

    if (!user.isVerified) {
      await sendVerificationEmail(user.email, user?.verifyCode);
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );

    return res.json({
      success: true,
      token,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.blocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
    }

    if (user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your email is already verified",
      });
    } else {
      await sendVerificationEmail(user.email, user?.verifyCode);
    }

    return res.json({
      success: true,
      message: "Verification code resent successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    if (user.verifyCode != code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    user.isVerified = true;
    user.verifyCode = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const code = generateCode();
    const updateUser = await User.findOneAndUpdate(
      { email },
      {
        resetPasswordCode: code,
      },
    );

    await sendVerificationEmail(user.email, code);

    return res.status(200).json({
      success: true,
      message: "Password reset code has been sent to your email.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.resetPasswordCode != code) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset code",
      });
    }

    user.password = password;
    user.resetPasswordCode = undefined;

    await user.save();

    // return res.success("Password reset successfully.");
    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error: any) {
    // return res.error(error.message, error, 500);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addToFavorites = async (req: request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const exists = user.favorites.some((id) => id.toString() === propertyId);

    if (!exists) {
      const newFav = [...user.favorites, propertyId];
      await User.findByIdAndUpdate(req?.user?._id, {
        favorites: newFav,
      });

      await Property.findByIdAndUpdate(propertyId, {
        $inc: {
          favoritesCount: 1,
        },
      });
      const property = await Property.findById(propertyId).populate("category");

      if (property) {
        await User.findByIdAndUpdate(req.user!._id, {
          $addToSet: {
            "preferences.cities": property.city,
            "preferences.propertyTypes": (property.category as any).name,
          },
          $min: {
            "preferences.minPrice": property.price,
          },
          $max: {
            "preferences.maxPrice": property.price,
            "preferences.bedrooms": property.bedrooms,
          },
        });
      }
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeFromFavorites = async (req: request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const exists = user.favorites.some((id) => id.toString() === propertyId);

    if (exists) {
      const newFav = user.favorites.filter(
        (id) => id.toString() !== propertyId,
      );

      await User.findByIdAndUpdate(req?.user?._id, {
        favorites: newFav,
      });

      await Property.findByIdAndUpdate(propertyId, {
        $inc: {
          favoritesCount: -1,
        },
      });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFavorites = async (req: request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).populate("favorites");

    res.json({
      success: true,
      data: user?.favorites,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePreferences = async (req: request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        preferences: req.body,
      },
      {
        new: true,
      },
    );

    res.json({
      success: true,
      data: user?.preferences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPreferences = async (req: request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select("preferences");

    res.json({
      success: true,
      data: user?.preferences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addRecentlyViewed = async (req: request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const exists = user.recentlyViewed.some(
      (id) => id.toString() === propertyId,
    );

    if (!exists) {
      const newView = [...user.recentlyViewed, propertyId];
      await User.findByIdAndUpdate(req?.user?._id, {
        recentlyViewed: newView,
      });

      await Property.findByIdAndUpdate(propertyId, {
        $inc: {
          favoritesCount: 1,
          viewsCount: 1,
        },
      });
    }

    res.json({
      success: true,
      data: propertyId,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRecentlyViewed = async (req: request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).populate("recentlyViewed");

    res.json({
      success: true,
      data: user?.recentlyViewed,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (req: request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .select("-password -verifyCode -resetPasswordCode -refreshToken")
      .populate("favorites")
      .populate("recentlyViewed");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdminDashboard = async (req: request, res: Response) => {
  try {
    const [
      users,
      agents,
      properties,
      bookings,
      pendingProperties,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.CUSTOMER }),

      User.countDocuments({ role: UserRole.AGENT }),

      Property.countDocuments(),

      Booking.countDocuments(),

      Property.countDocuments({
        status: PropertyStatus.PENDING,
      }),

      Payment.aggregate([
        {
          $match: {
            status: PaymentStatus.SUCCEEDED,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$amount",
            },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        users,
        agents,
        properties,
        bookings,
        revenue: revenueResult[0]?.totalRevenue || 0,
        pendingProperties,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAdminAnalytics = async (req: request, res: Response) => {
  try {
    const [
      totalRevenue,
      monthlyRevenue,
      monthlyBookings,
      propertyViews,
      userGrowth,
      topAgents,
      topProperties,
    ] = await Promise.all([
      // Total Revenue
      Payment.aggregate([
        {
          $match: {
            status: PaymentStatus.SUCCEEDED,
          },
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: "$amount",
            },
          },
        },
      ]),

      // Monthly Revenue
      Payment.aggregate([
        {
          $match: {
            status: PaymentStatus.SUCCEEDED,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: {
              $sum: "$amount",
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // Monthly Bookings
      Booking.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // Total Property Views
      Property.aggregate([
        {
          $group: {
            _id: null,
            views: {
              $sum: "$views",
            },
          },
        },
      ]),

      // User Growth
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            users: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // Top Agents by Revenue
      Payment.aggregate([
        {
          $match: {
            status: PaymentStatus.SUCCEEDED,
          },
        },
        {
          $lookup: {
            from: "bookings",
            localField: "booking",
            foreignField: "_id",
            as: "booking",
          },
        },
        {
          $unwind: "$booking",
        },
        {
          $lookup: {
            from: "properties",
            localField: "booking.property",
            foreignField: "_id",
            as: "property",
          },
        },
        {
          $unwind: "$property",
        },
        {
          $group: {
            _id: "$property.owner",
            revenue: {
              $sum: "$amount",
            },
            bookings: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            revenue: -1,
          },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "agent",
          },
        },
        {
          $unwind: "$agent",
        },
        {
          $project: {
            _id: 1,
            revenue: 1,
            bookings: 1,
            name: "$agent.name",
            email: "$agent.email",
          },
        },
      ]),

      // Top Viewed Properties
      Property.find()
        .sort({ views: -1 })
        .limit(5)
        .populate("owner", "name email")
        .select("title views owner"),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.revenue || 0,
        monthlyRevenue,
        monthlyBookings,
        propertyViews: propertyViews[0]?.views || 0,
        userGrowth,
        topAgents,
        topProperties,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAgentDashboard = async (req: request, res: Response) => {
  try {
    const agentId = req.user!._id;

    // Get all property ids owned by the agent
    const propertyIds = await Property.find({
      owner: agentId,
    }).distinct("_id");

    const [
      properties,
      pendingBookings,
      completedBookings,
      earningsResult,
      unreadMessages,
    ] = await Promise.all([
      Property.countDocuments({
        owner: agentId,
      }),

      Booking.countDocuments({
        property: { $in: propertyIds },
        status: BookingStatus.PENDING,
      }),

      Booking.countDocuments({
        property: { $in: propertyIds },
        status: BookingStatus.COMPLETED,
      }),

      Payment.aggregate([
        {
          $match: {
            booking: { $exists: true },
            status: PaymentStatus.SUCCEEDED,
          },
        },
        {
          $lookup: {
            from: "bookings",
            localField: "booking",
            foreignField: "_id",
            as: "booking",
          },
        },
        {
          $unwind: "$booking",
        },
        {
          $lookup: {
            from: "properties",
            localField: "booking.property",
            foreignField: "_id",
            as: "property",
          },
        },
        {
          $unwind: "$property",
        },
        {
          $match: {
            "property.owner": agentId,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),

      Message.countDocuments({
        receiver: agentId,
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        properties,
        pendingBookings,
        completedBookings,
        earnings: earningsResult[0]?.total || 0,
        unreadMessages,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAgents = async (req: request, res: Response) => {
  try {
    const users=await User.find({role:UserRole?.AGENT})
    return res.status(200).json({
      success: true,
      data:users,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
