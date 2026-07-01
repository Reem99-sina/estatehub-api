import mongoose, { Document } from "mongoose";

export enum PropertyPurpose {
  SALE = "Sale",
  RENT = "Rent",
}

export enum PropertyStatus {
  AVAILABLE = "Available",
  PENDING = "Pending",
  SOLD = "Sold",
  RENTED = "Rented",
}

interface ILocation {
  lat?: number;
  lng?: number;
}

interface IImage {
  url: string;
  public_id: string;
}

export interface IProperty extends Document {
  title: string;
  description: string;
  purpose: PropertyPurpose;
  status: PropertyStatus;
  priceHistory: { price: number, changedAt: Date }[];
  price: number;
  area: number;

  bedrooms: number;
  bathrooms: number;

  floor?: number;
  yearBuilt?: number;

  city: string;
  address: string;

  location?: ILocation;

  images: IImage[];

  amenities: string[];

  owner: mongoose.Types.ObjectId;

  category?: mongoose.Types.ObjectId;

  viewsCount: number;
  favoritesCount: number;
  bookingsCount: number;

  averageRating: number;
  totalReviews: number;

  isApproved: boolean;
  featured: boolean;

  embedding: number[];
}
