import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import { protect } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ==============================
// 🔥 SOCKET.IO SETUP (Day 8)
// ==============================
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
    },
});

// Make io accessible in controllers
app.set("io", io);

// ==============================
// 🔌 SOCKET CONNECTION HANDLING
// ==============================
io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Admin joins admin room
    socket.on("join_admin", () => {
        socket.join("admin");
        console.log("👨‍⚕️ Admin joined admin room");
    });

    // Driver joins their own room
    socket.on("join_driver", (driverId) => {
        socket.join(`driver:${driverId}`);
        console.log(`🚑 Driver ${driverId} joined room`);
    });

    // User joins their own room
    socket.on("join_user", (userId) => {
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });
});

// ==============================
// 🧱 MIDDLEWARES
// ==============================
app.use(express.json());
app.use(cors());

// Disable CSP for frontend/CDN compatibility
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

app.use(morgan("dev"));

// ==============================
// ❤️ HEALTH CHECK
// ==============================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running 🚑",
        socketConnections: io.engine.clientsCount,
    });
});

// ==============================
// 🔌 MONGODB CONNECTION
// ==============================
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/ambulanceDB")
    .then(() => console.log("MongoDB Connected ✅"))
    .catch((err) => console.log("MongoDB Error ❌", err));

// ==============================
// 🔐 PROTECTED TEST ROUTE
// ==============================
app.get("/api/protected", protect, (req, res) => {
    res.json({
        success: true,
        message: "Protected route accessed successfully ✅",
        user: req.user,
    });
});

// ==============================
// 📌 ROUTE MOUNTING (Day 9)
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
console.log("📌 Admin routes mounted at /api/admin");

app.use("/api/drivers", driverRoutes);
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
app.use((err, req, res, next) => {
    console.error("🔥 Error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 Socket.IO ready on ws://localhost:${PORT}`);
});