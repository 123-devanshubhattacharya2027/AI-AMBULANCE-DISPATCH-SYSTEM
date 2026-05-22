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
    getDrivers
} from "../controllers/driverController.js";

const router = express.Router();

/*
========================================
🚑 ADMIN ROUTES
========================================
*/

// ✅ CREATE DRIVER
router.post("/", protect, authorizeRoles("ADMIN"), createDriver);

// ✅ GET ALL DRIVERS
router.get("/", protect, authorizeRoles("ADMIN"), getDrivers);


/*
========================================
🚑 DRIVER ROUTES
========================================
*/

// ✅ GET DRIVER PROFILE
router.get("/me", protect, authorizeRoles("DRIVER"), getMyDriverProfile);

// ========================================
// 📍 STEP 3 — DRIVER LOCATION ROUTE (FINAL)
// ========================================
// 🔥 This is the MAIN API used for real-time tracking
router.patch(
    "/me/location",
    protect,
    authorizeRoles("DRIVER"),
    validateLocation,
    updateDriverLocation
);

// ========================================
// 🧪 OPTIONAL DEBUG ROUTE (VERY USEFUL)
// ========================================
// 👉 Use this in Postman if socket not working
router.post(
    "/test-location",
    protect,
    authorizeRoles("DRIVER"),
    async (req, res) => {
        const io = req.app.get("io");

        const { latitude, longitude } = req.body;

        const payload = {
            driverId: req.user._id,
            coordinates: [latitude, longitude],
        };

        if (io) {
            io.emit("location_update", payload);
        }

        res.json({
            success: true,
            message: "Test location emitted",
            data: payload,
        });
    }
);

// ========================================
// 🔁 AVAILABILITY
// ========================================
router.patch(
    "/me/availability",
    protect,
    authorizeRoles("DRIVER"),
    toggleAvailability
);

// ========================================
// 📦 ASSIGNED REQUESTS
// ========================================
router.get(
    "/me/requests",
    protect,
    authorizeRoles("DRIVER"),
    getAssignedRequests
);

export default router; 