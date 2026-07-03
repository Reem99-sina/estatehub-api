import { Request, Response } from "express";
import Property from "../models/property.model";
import { request } from "../type/express";
import { UserRole } from "../type/user";
import { createNotification } from "./notification.services";
import { NotificationType } from "../type/notification";
import { uploadMultipleToCloudinary } from "../lib/uploadMultipleToCloudinary";

export const addProperties = async (req: request, res: Response) => {
  try {
    const {
      title,
      description,
      purpose,
      price,
      area,
      bedrooms,
      bathrooms,
      floor,
      yearBuilt,
      city,
      address,
      category,
      amenities,
      location,
    } = req.body;

    // Parse location if sent as JSON string
    const parsedLocation =
      typeof location === "string" ? JSON.parse(location) : location;

    // Parse amenities if sent as JSON string
    const parsedAmenities =
      typeof amenities === "string" ? JSON.parse(amenities) : amenities || [];
    const geoLocation = {
      type: "Point",
      coordinates: [Number(parsedLocation.lng), Number(parsedLocation.lat)],
    };

    let images: Array<{ url?: string; public_id?: string }> = [];

    if (req.files && Array.isArray(req.files)) {
      const uploadedImages = await uploadMultipleToCloudinary(
        req.files,
        "estatehub/properties",
      );
      images = uploadedImages.map((url) => ({ url }));
    }

    const property = await Property.create({
      title,
      description,
      purpose,
      price: Number(price),
      area: Number(area),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      floor: floor ? Number(floor) : undefined,
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
      city,
      address,
      category,
      amenities: parsedAmenities,
      location: geoLocation,
      images,
      owner: req.user?._id,

      priceHistory: [
        {
          price: Number(price),
          changedAt: new Date(),
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Property created successfully.",
      data: property,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const updateProperty = async (req: request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (req.user!.role == UserRole.CUSTOMER) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this property",
      });
    }

    const data: any = { ...req.body };

    if (data.location) {
      const parsedLocation =
        typeof data.location === "string"
          ? JSON.parse(data.location)
          : data.location;

      data.location = {
        type: "Point",
        coordinates: [Number(parsedLocation.lng), Number(parsedLocation.lat)],
      };
    }

    // if (data.amenities) {
    //   data.amenities =
    //     typeof data.amenities === "string"
    //       ? JSON.parse(data.amenities)
    //       : data.amenities;
    // }

    if (req.files && Array.isArray(req.files)) {
      const newImages = await uploadMultipleToCloudinary(
        req.files,
        "estatehub/properties",
      );

      data.images = newImages;
    }

    // if (data.price && Number(data.price) !== property.price) {
    //   data.priceHistory =
    //     {
    //       price: Number(data.price),
    //       changedAt: new Date(),
    //     }

    // }

    const updatedProperty = await Property.findByIdAndUpdate(propertyId, data, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      message: "Property updated successfully",
      data: updatedProperty,
    });
  } catch (error: any) {
    console.log(error, "errror");
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProperty = async (req: request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (req.user!.role !== UserRole.CUSTOMER) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this property",
      });
    }

    await property.deleteOne();

    return res.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdminProperties = async (req: request, res: Response) => {
  try {
    const {
      city,
      purpose,
      category,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      page = "1",
      limit = "10",
      sort = "newest",
    } = req.query;

    const filter: any = {};

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (purpose) {
      filter.purpose = purpose;
    }

    if (category) {
      filter.category = category;
    }

    if (bedrooms) {
      filter.bedrooms = {
        $lte: Number(bedrooms),
      };
    }

    if (bathrooms) {
      filter.bathrooms = {
        $lte: Number(bathrooms),
      };
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) filter.price.$gte = Number(minPrice);

      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption: any = {};

    switch (sort) {
      case "price_asc":
        sortOption.price = 1;
        break;

      case "price_desc":
        sortOption.price = -1;
        break;

      case "oldest":
        sortOption.createdAt = 1;
        break;

      case "most_viewed":
        sortOption.viewsCount = -1;
        break;

      case "highest_rated":
        sortOption.averageRating = -1;
        break;

      default:
        sortOption.createdAt = -1;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const total = await Property.countDocuments(filter);

    const properties = await Property.find(filter)
      .populate("owner", "name avatar")
      .populate("category", "name")
      .sort(sortOption)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      success: true,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      data: properties,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProperties = async (req: request, res: Response) => {
  try {
    const {
      city,
      purpose,
      category,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      page = "1",
      limit = "10",
      sort = "newest",
    } = req.query;

    const filter: any = {
      isApproved: true,
    };

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (purpose) {
      filter.purpose = purpose;
    }

    if (category) {
      filter.category = category;
    }

    if (bedrooms) {
      filter.bedrooms = {
        $gte: Number(bedrooms),
      };
    }

    if (bathrooms) {
      filter.bathrooms = {
        $gte: Number(bathrooms),
      };
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) filter.price.$gte = Number(minPrice);

      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption: any = {};

    switch (sort) {
      case "price_asc":
        sortOption.price = 1;
        break;

      case "price_desc":
        sortOption.price = -1;
        break;

      case "oldest":
        sortOption.createdAt = 1;
        break;

      case "most_viewed":
        sortOption.viewsCount = -1;
        break;

      case "highest_rated":
        sortOption.averageRating = -1;
        break;

      default:
        sortOption.createdAt = -1;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const total = await Property.countDocuments(filter);

    const properties = await Property.find(filter)
      .populate("owner", "name avatar")
      .populate("category", "name")
      .sort(sortOption)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      success: true,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      data: properties,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFeaturedProperties = async (req: request, res: Response) => {
  try {
    const { limit = "8" } = req.query;

    const properties = await Property.find({
      featured: true,
      isApproved: true,
    })
      .populate("owner", "name avatar")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPropertiesById = async (req: request, res: Response) => {
  try {
    const { id } = req.params;

    const properties = await Property.findOne({
      _id:id,
      isApproved: true,
    })
      .populate("owner", "name avatar")
      .populate("category", "name")
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      
      data: properties,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const compareProperties = async (req: Request, res: Response) => {
  try {
    const ids = (req.query.ids as string)?.split(",");

    if (!ids || ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Select at least two properties",
      });
    }

    if (ids.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum 4 properties can be compared",
      });
    }

    const properties = await Property.find({
      _id: { $in: ids },
      isApproved: true,
    })
      .populate("category")
      .populate("owner");

    return res.json({
      success: true,
      data: properties,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const togglePropertyApproval = async (req: request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    property.isApproved = !property.isApproved;

    await property.save();
    if (property.isApproved == false) {
      await createNotification({
        user: property.owner.toString(),
        title: "Property Approved",
        body: `"${property.title}" has been approved and is now live.`,
        type: NotificationType.PROPERTY,
      });
    }

    if (property.isApproved == true) {
      await createNotification({
        user: property.owner.toString(),
        title: "Property Rejected",
        body: `"${property.title}" was rejected. Please review and update your listing.`,
        type: NotificationType.PROPERTY,
      });
    }

    return res.json({
      success: true,
      message: `Property ${
        property.isApproved ? "approved" : "unapproved"
      } successfully.`,
      data: property,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
