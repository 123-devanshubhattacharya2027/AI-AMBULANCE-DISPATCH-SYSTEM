import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

import {
    createDriver,
    getMyDriverProfile,
    updateDriverLocation,
    toggleAvailability,
    getAssignedRequests,
} from "../controllers/driverController.js";

const router = express.Router();

/*
====================================================
🔑 ADMIN — DRIVER MANAGEMENT
====================================================
*/

// ✅ Create Driver (Admin only)
router.post(
    "/",
    protect,
    authorizeRoles("ADMIN"),
    createDriver
);

/*
====================================================
🚑 DRIVER — SELF MANAGEMENT
====================================================
*/

// ✅ Get My Driver Profile
router.get(
    "/me",
    protect,
    authorizeRoles("DRIVER"),
    getMyDriverProfile
);

// ✅ Update My Location (GPS)
router.patch(
    "/me/location",
    protect,
    authorizeRoles("DRIVER"),
    updateDriverLocation
);

// ✅ Toggle Online/Offline
router.patch(
    "/me/availability",
    protect,
    authorizeRoles("DRIVER"),
    toggleAvailability
);

// ✅ Get My Assigned Requests
router.get(
    "/me/requests",
    protect,
    authorizeRoles("DRIVER"),
    getAssignedRequests
);

export default router;