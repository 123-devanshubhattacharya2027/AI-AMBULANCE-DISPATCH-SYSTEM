import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
    createRequest,
    getMyRequests,
    updateRequestStatus
} from "../controllers/requestController.js";

const router = express.Router();

// ==========================================
// ✅ Create Emergency Request (USER)
// ==========================================
router.post("/", protect, createRequest);

// ==========================================
// ✅ Get My Requests (USER)
// ==========================================
router.get("/my", protect, getMyRequests);

// ==========================================
// ✅ Update Request Status (Day 6)
// ==========================================
router.patch("/:id/status", protect, updateRequestStatus);

export default router;