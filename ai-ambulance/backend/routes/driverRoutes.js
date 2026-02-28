import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { createDriver } from "../controllers/driverController.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createDriver);

export default router;