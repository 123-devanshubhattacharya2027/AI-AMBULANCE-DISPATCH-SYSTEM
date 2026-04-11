import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateLocation } from "../middleware/validateLocation.js";

import {
    createDriver,
    getMyDriverProfile,
    updateDriverLocation,
    toggleAvailability,
    getAssignedRequests,
    getDrivers // 🔥 ADD THIS
} from "../controllers/driverController.js";

const router = express.Router();

/*
========================================
🚑 ADMIN ROUTES
========================================
*/

// ✅ CREATE DRIVER
router.post("/", protect, authorizeRoles("ADMIN"), createDriver);

// ✅ GET ALL DRIVERS (🔥 STEP 1 FIX)
router.get("/", protect, authorizeRoles("ADMIN"), getDrivers);


/*
========================================
🚑 DRIVER ROUTES
========================================
*/

// ✅ DRIVER PROFILE
router.get("/me", protect, authorizeRoles("DRIVER"), getMyDriverProfile);

// ✅ UPDATE LOCATION
router.patch(
    "/me/location",
    protect,
    authorizeRoles("DRIVER"),
    validateLocation,
    updateDriverLocation
);

// ✅ TOGGLE AVAILABILITY
router.patch(
    "/me/availability",
    protect,
    authorizeRoles("DRIVER"),
    toggleAvailability
);

// ✅ GET ASSIGNED REQUESTS
router.get(
    "/me/requests",
    protect,
    authorizeRoles("DRIVER"),
    getAssignedRequests
);

export default router;