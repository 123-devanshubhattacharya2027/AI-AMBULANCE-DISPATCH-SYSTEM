import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import { authorizeRoles } from "../middleware/authorizeRoles.js";

import {
    createRequest,
    getMyRequests,
    getAllRequests,
    updateRequestStatus,
    cancelRequest,
    assignDriver
} from "../controllers/requestController.js";

const router = express.Router();

/*
====================================================
🧑 USER ROUTES
====================================================
*/

// ✅ Create Emergency Request
router.post(
    "/",
    protect,
    authorizeRoles("USER"),
    createRequest
);

// ✅ Get My Requests
router.get(
    "/my",
    protect,
    authorizeRoles("USER"),
    getMyRequests
);

// ❌ Cancel Request
router.patch(
    "/:id/cancel",
    protect,
    authorizeRoles("USER"),
    cancelRequest
);

/*
====================================================
🚑 ADMIN ROUTES
====================================================
*/

// ✅ Get All Requests
router.get(
    "/",
    protect,
    authorizeRoles("ADMIN"),
    getAllRequests
);

// 🚑 ASSIGN DRIVER
router.patch(
    "/:id/assign-driver",
    protect,
    authorizeRoles("ADMIN"),
    assignDriver
);

/*
====================================================
🚑 STATUS MANAGEMENT
====================================================
*/

// ✅ Update Status
router.patch(
    "/:id/status",
    protect,
    authorizeRoles(
        "USER",
        "DRIVER",
        "ADMIN"
    ),
    updateRequestStatus
);

export default router;