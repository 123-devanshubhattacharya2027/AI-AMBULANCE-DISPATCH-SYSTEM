import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

import {
    createRequest,
    getMyRequests,
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
// Controller decides permission logic
router.patch(
    "/:id/status",
    protect,
    authorizeRoles("USER", "DRIVER", "ADMIN"),
    updateRequestStatus
);

export default router;
