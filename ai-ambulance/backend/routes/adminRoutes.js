import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ADMIN only test route
router.get(
    "/test",
    protect,
    authorize("ADMIN", "DRIVER"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome Admin 🚑",
            user: req.user
        });
    }
);

export default router;