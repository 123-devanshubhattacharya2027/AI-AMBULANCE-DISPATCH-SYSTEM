import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// 🔒 Any logged-in user
router.get("/profile", protect, (req, res) => {
    res.json({
        success: true,
        message: "Profile accessed",
        user: req.user
    });
});

// 🔒 Admin only
router.get("/admin-only", protect, authorizeRoles("ADMIN"), (req, res) => {
    res.json({
        success: true,
        message: "Welcome Admin"
    });
});

export default router;