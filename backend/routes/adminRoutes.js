import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

import {
    getAllRequests,
    getRequestById,
    assignDriver, // ✅ Day 10 import
} from "../controllers/adminController.js";

const router = express.Router();

/*
====================================================
🚨 REQUEST MANAGEMENT (DAY 9 + DAY 10)
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

// 🚑 DAY 10 — Assign Driver to Request
router.patch(
    "/requests/:id/assign-driver",
    protect,
    authorizeRoles("ADMIN"),
    assignDriver
);

export default router;