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

// ✅ Security
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

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
        logger.info("Admin joined room");
    });

    socket.on("join_driver", (driverId) => {
        socket.join(`driver:${driverId}`);
        logger.info(`Driver joined: ${driverId}`);
    });

    socket.on("join_user", (userId) => {
        socket.join(`user:${userId}`);
        logger.info(`User joined: ${userId}`);
    });

    socket.on("disconnect", () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

// ==============================
// 🧱 MIDDLEWARES (ORDER MATTERS)
// ==============================

// 🌐 CORS
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// 📦 Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔐 Security Layers
app.use(mongoSanitize());
app.use(xss());

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

// 📊 HTTP Logger
app.use(morgan("dev"));

// ==============================
// 🚦 RATE LIMITING
// ==============================

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// ==============================
// ❤️ HEALTH CHECK
// ==============================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running 🚑",
        uptime: process.uptime(),
        timestamp: new Date(),
        socketConnections: io.engine.clientsCount,
    });
});

// ==============================
// 🔌 DATABASE CONNECTION
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
        message: "Protected route accessed successfully",
        user: req.user,
    });
});

// ==============================
// 📌 ROUTES
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/requests", requestRoutes);

// ==============================
// 🏠 ROOT ROUTE
// ==============================
app.get("/", (req, res) => {
    res.send("AI Ambulance Backend Running 🚑");
});

// ==============================
// ❌ 404 HANDLER
// ==============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// ==============================
// 🔥 GLOBAL ERROR HANDLER
// ==============================
app.use(errorHandler);

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Socket.IO ready`);
});