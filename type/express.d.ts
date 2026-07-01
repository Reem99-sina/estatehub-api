// import "express-serve-static-core";
// import { IUser } from "../type/user";
import { Request, Response } from "express";
// declare global {
//   namespace Express {
//     interface Request {
//       user?: HydratedDocument<IUser>;
//     }
//   }
// }

// export {}

export interface request extends Request  {

  user?: HydratedDocument<IUser>
}