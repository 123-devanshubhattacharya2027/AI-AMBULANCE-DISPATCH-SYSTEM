import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import { protect } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// ==============================
// Middlewares
// ==============================
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// ==============================
// Health Route (ADD HERE ✅)
// ==============================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running 🚑"
    });
});

// ==============================
// MongoDB Connection
// ==============================
mongoose.connect("mongodb://localhost:27017/ambulanceDB")
    .then(() => console.log("MongoDB Connected ✅"))
    .catch((err) => console.log("MongoDB Error ❌", err));

// ==============================
// Protected Test Route
// ==============================
app.get("/api/protected", protect, (req, res) => {
    res.json({
        success: true,
        message: "Protected route accessed successfully ✅",
        user: req.user
    });
});

// ==============================
// Route Mounting
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/requests", requestRoutes);

// ==============================
// Root Route
// ==============================
app.get("/", (req, res) => {
    res.send("AI Ambulance Backend Running 🚑");
});

// ==============================
// Start Server
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});