import { Schema, model } from "mongoose";
import { CategoryName, ICategory } from "../type/category";


const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);



const Category = model<ICategory>("Category", categorySchema);

export default Category;