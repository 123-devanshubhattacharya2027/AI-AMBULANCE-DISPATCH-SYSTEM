import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

import {
    createRequest,
    getMyRequests,
    updateRequestStatus
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
🚑 DRIVER ROUTES
====================================================
*/

// ✅ Update Request Status (Only DRIVER)
router.patch(
    "/:id/status",
    protect,
    authorizeRoles("DRIVER"),
    updateRequestStatus
);

export default router;