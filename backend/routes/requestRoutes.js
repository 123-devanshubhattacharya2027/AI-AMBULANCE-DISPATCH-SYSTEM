import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

import {
    createRequest,
    getMyRequests,
    getAllRequests, // 🔥 NEW (STEP 2)
    updateRequestStatus,
    assignDriver
} from "../controllers/requestController.js";

const router = express.Router();

/*
====================================================
🧑 USER ROUTES
====================================================
*/

// ✅ Create Emergency Request (Only USER)
router.post(
    "/",
    protect,
    authorizeRoles("USER"),
    createRequest
);

// ✅ Get My Requests (Only USER)
router.get(
    "/my",
    protect,
    authorizeRoles("USER"),
    getMyRequests
);

/*
====================================================
🚑 ADMIN ROUTES
====================================================
*/

// 🔥 STEP 2 — GET ALL REQUESTS (Only ADMIN)
router.get(
    "/",
    protect,
    authorizeRoles("ADMIN"),
    getAllRequests
);

// ✅ Assign Driver to Request (Only ADMIN)
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

// ✅ Update Request Status (USER / DRIVER / ADMIN)
router.patch(
    "/:id/status",
    protect,
    authorizeRoles("USER", "DRIVER", "ADMIN"),
    updateRequestStatus
);

export default router;