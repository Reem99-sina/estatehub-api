import mongoose from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  AGENT = "agent",
  CUSTOMER = "customer",
}

export const roles = {
  admin: UserRole.ADMIN,
  agent: UserRole.AGENT,
  customer: UserRole.CUSTOMER,
};

interface IUserPreferences {
  cities: string[];
  propertyTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: UserRole;
  isVerified: boolean;
  blocked: boolean;
  favorites: mongoose.Types.ObjectId[];
  recentlyViewed: mongoose.Types.ObjectId[];
  preferences: IUserPreferences;
  refreshToken?: string;
  verifyCode?: string;
  resetPasswordCode?: string;
  socketId?: string;
  isOnline: boolean;
  lastSeen: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface CustomResponse extends Response {
  success: (message: string, data?: unknown, status?: number) => Response;

  error: (message: string, errors?: unknown, status?: number) => Response;
}
