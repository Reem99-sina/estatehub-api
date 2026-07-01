import { fileType, myMulter } from "../lib/multer";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";

import express from "express";
import { UserRole } from "../type/user";
import {
  addPropertySchema,
//   updatePropertyApprovalSchema,
  updatePropertySchema,
} from "../validations/property.validation";
import {
  addProperties,
  compareProperties,
  deleteProperty,
  getAdminProperties,
  getProperties,
  togglePropertyApproval,
  updateProperty,
} from "../services/property.services";
import { parseFormData } from "../middleware/progress";
import { propertyIdSchema } from "../validations/user.validation";
const router = express.Router();

router.post(
  "/",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  myMulter("images", fileType.IMAGE).array("images", 10),
  parseFormData,
  validate(addPropertySchema),
  addProperties,
);
router.patch(
  "/:propertyId",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  myMulter("images", fileType.IMAGE).array("images", 10),
  parseFormData,
  validate(propertyIdSchema, "params"),
  validate(updatePropertySchema),
  updateProperty,
);

router.get(
  "/admin",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  getAdminProperties,
);
router.get("/", getProperties);
router.get("/compare", compareProperties);
router.delete("/:id", auth([UserRole.ADMIN, UserRole.AGENT]), deleteProperty);

router.patch(
  "/:propertyId/approval",
  auth([UserRole.ADMIN, UserRole.AGENT]),
  togglePropertyApproval,
);
export default router;
