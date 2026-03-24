import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

import {
    getAllRequests,
    getRequestById,
} from "../controllers/adminController.js";

const router = express.Router();

/*
====================================================
🚨 REQUEST MANAGEMENT (DAY 9 ONLY)
====================================================
*/

// ✅ Get All Emergency Requests (with filters & sorting)
router.get(
    "/requests",
    protect,
    authorizeRoles("ADMIN"),
    getAllRequests
);

// ✅ Get Single Request by ID
router.get(
    "/requests/:id",
    protect,
    authorizeRoles("ADMIN"),
    getRequestById
);

export default router;