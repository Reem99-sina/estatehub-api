export enum CategoryName {
  APARTMENT = "Apartment",
  VILLA = "Villa",
  HOUSE = "House",
  STUDIO = "Studio",
  OFFICE = "Office",
  LAND = "Land",
}

export interface ICategory {
  name: CategoryName;

  createdAt?: Date;
  updatedAt?: Date;
}
