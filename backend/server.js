
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";

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
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
    },
});

app.set("io", io);

// ==============================
// 🔌 SOCKET CONNECTION
// ==============================
io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on("join_admin", () => {
        socket.join("admin");
        console.log("👨‍⚕️ Admin joined admin room");
    });

    socket.on("join_driver", (driverId) => {
        socket.join(`driver:${driverId}`);
        console.log(`🚑 Driver ${driverId} joined room`);
    });

    socket.on("join_user", (userId) => {
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });
});

// ==============================
// 🧱 MIDDLEWARES (FIXED ORDER)
// ==============================
app.use(cors());

app.use(express.json()); // ✅ MUST be before routes
app.use(express.urlencoded({ extended: true }));

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
// 📌 ROUTES
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/requests", requestRoutes);

console.log("📌 Routes mounted successfully");

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

