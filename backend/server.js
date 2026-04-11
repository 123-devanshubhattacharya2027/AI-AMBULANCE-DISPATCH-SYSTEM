import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";

// ✅ Logger
import { logger } from "./utils/logger.js";

// ✅ Rate Limiting
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";

// ✅ Error Handler
import { errorHandler } from "./middleware/errorMiddleware.js";

// ✅ Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

import { protect } from "./middleware/authMiddleware.js";

dotenv.config();

// ==============================
// 🚀 APP INIT
// ==============================
const app = express();
const httpServer = createServer(app);

// ==============================
// 🔥 SOCKET.IO SETUP
// ==============================
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PATCH", "DELETE"],
    },
});

app.set("io", io);

// ==============================
// 🔌 SOCKET CONNECTION
// ==============================
io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("join_admin", () => {
        socket.join("admin");
    });

    socket.on("join_driver", (driverId) => {
        socket.join(`driver:${driverId}`);
    });

    socket.on("join_user", (userId) => {
        socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

// ==============================
// 🧱 MIDDLEWARES
// ==============================
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

app.use(morgan("dev"));

// ==============================
// 🚦 RATE LIMITING
// ==============================
app.use("/api/auth", authLimiter);

// ==============================
// ❤️ HEALTH CHECK
// ==============================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running 🚑",
    });
});

// ==============================
// 🔌 DATABASE
// ==============================
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/ambulanceDB")
    .then(() => logger.info("MongoDB Connected"))
    .catch((err) => logger.error(`MongoDB Error: ${err.message}`));

// ==============================
// 🔐 PROTECTED TEST ROUTE
// ==============================
app.get("/api/protected", protect, (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});

// ==============================
// 📌 ROUTES
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// 🔥 FIXED HERE
app.use("/api/drivers", driverRoutes);

app.use("/api/requests", requestRoutes);

// ==============================
// 🏠 ROOT
// ==============================
app.get("/", (req, res) => {
    res.send("Ambulance Backend Running 🚑");
});

// ==============================
// ❌ 404
// ==============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// ==============================
// 🔥 ERROR HANDLER
// ==============================
app.use(errorHandler);

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});