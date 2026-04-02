import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateLocation } from "../middleware/validateLocation.js"; // ✅ added

import {
    createDriver,
    getMyDriverProfile,
    updateDriverLocation,
    toggleAvailability,
    getAssignedRequests,
    getAssignedRequest
} from "../controllers/driverController.js";

const router = express.Router();

// ============================
// ADMIN
// ============================
router.post("/", protect, authorizeRoles("ADMIN"), createDriver);

// ============================
// DRIVER
// ============================
router.get("/me", protect, authorizeRoles("DRIVER"), getMyDriverProfile);

// 🚑 Update Live Location (Day 12 MAIN API)
router.patch(
    "/me/location",
    protect,
    authorizeRoles("DRIVER"),
    validateLocation,   // ✅ added here
    updateDriverLocation
);

router.patch("/me/availability", protect, authorizeRoles("DRIVER"), toggleAvailability);

router.get("/me/requests", protect, authorizeRoles("DRIVER"), getAssignedRequests);

// ============================
// ACTIVE REQUEST
// ============================
router.get("/assigned", protect, authorizeRoles("DRIVER"), getAssignedRequest);

export default router;