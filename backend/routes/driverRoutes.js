import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateLocation } from "../middleware/validateLocation.js";

import {
    createDriver,
    getMyDriverProfile,
    updateDriverLocation,
    toggleAvailability,
    getAssignedRequests
} from "../controllers/driverController.js";

const router = express.Router();

// ADMIN
router.post("/", protect, authorizeRoles("ADMIN"), createDriver);

// DRIVER
router.get("/me", protect, authorizeRoles("DRIVER"), getMyDriverProfile);

router.patch(
    "/me/location",
    protect,
    authorizeRoles("DRIVER"),
    validateLocation,
    updateDriverLocation
);

router.patch("/me/availability", protect, authorizeRoles("DRIVER"), toggleAvailability);

router.get("/me/requests", protect, authorizeRoles("DRIVER"), getAssignedRequests);

export default router;