import EmergencyRequest from "../models/EmergencyRequest.js";
import { ALLOWED_TRANSITIONS } from "../constants/statusTransitions.js";
import User from "../models/User.js";
import Driver from "../models/Driver.js"; // 🔥 IMPORTANT FIX
import asyncHandler from "express-async-handler";

// ==========================================
// ✅ CREATE EMERGENCY REQUEST
// ==========================================
export const createRequest = asyncHandler(async (req, res) => {
    const { emergencyType, description, location } = req.body;

    if (!emergencyType || !description) {
        res.status(400);
        throw new Error("Emergency type and description are required");
    }

    if (!location || !location.coordinates) {
        res.status(400);
        throw new Error("Location coordinates are required");
    }

    const [longitude, latitude] = location.coordinates;

    if (!longitude || !latitude) {
        res.status(400);
        throw new Error("Invalid coordinates");
    }

    const request = await EmergencyRequest.create({
        user: req.user._id,
        emergencyType,
        description,
        location: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
        },
        status: "PENDING",
        history: [
            {
                status: "PENDING",
                changedAt: new Date(),
                changedBy: req.user._id,
            },
        ],
    });

    const io = req.app.get("io");
    if (io) {
        io.to("admin").emit("new_request", request);
    }

    res.status(201).json({
        success: true,
        message: "Emergency request created successfully",
        data: request,
    });
});

// ==========================================
// ✅ GET MY REQUESTS (USER)
// ==========================================
export const getMyRequests = asyncHandler(async (req, res) => {
    const requests = await EmergencyRequest.find({
        user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "User requests fetched successfully",
        data: {
            count: requests.length,
            requests,
        },
    });
});

// ==========================================
// 🔥 GET ALL REQUESTS (ADMIN)
// ==========================================
export const getAllRequests = asyncHandler(async (req, res) => {
    const requests = await EmergencyRequest.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "All requests fetched successfully",
        data: {
            count: requests.length,
            requests,
        },
    });
});

// ==========================================
// ✅ UPDATE REQUEST STATUS
// ==========================================
export const updateRequestStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const request = await EmergencyRequest.findById(id);

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    const currentStatus = request.status;

    if (["COMPLETED", "CANCELLED"].includes(currentStatus)) {
        res.status(400);
        throw new Error(`Cannot update a ${currentStatus} request`);
    }

    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
        res.status(400);
        throw new Error(`Invalid transition from ${currentStatus} to ${status}`);
    }

    request.status = status;

    request.history.push({
        status,
        changedAt: new Date(),
        changedBy: req.user._id,
    });

    await request.save();

    const io = req.app.get("io");
    if (io) {
        io.emit("status_update", request);
        io.to(`user:${request.user}`).emit("status_update", request);
    }

    res.status(200).json({
        success: true,
        message: "Request status updated successfully",
        data: request,
    });
});

// ==========================================
// ✅ ASSIGN DRIVER (ADMIN) 🔥 FIXED
// ==========================================
export const assignDriver = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
        res.status(400);
        throw new Error("Driver ID is required");
    }

    const request = await EmergencyRequest.findById(id);

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    // 🔥 FIX: use Driver model
    const driver = await Driver.findById(driverId).populate("user");

    if (!driver) {
        res.status(400);
        throw new Error("Invalid driver");
    }

    if (!driver.isAvailable) {
        res.status(400);
        throw new Error("Driver not available");
    }

    if (request.status !== "PENDING") {
        res.status(400);
        throw new Error("Can only assign driver to PENDING request");
    }

    // ✅ Assign
    request.assignedDriver = driverId;
    request.status = "DISPATCHED";

    request.history.push({
        status: "DISPATCHED",
        changedAt: new Date(),
        changedBy: req.user._id,
    });

    await request.save();

    // 🔥 mark driver busy
    driver.isAvailable = false;
    await driver.save();

    // 🔥 socket
    const io = req.app.get("io");
    if (io) {
        io.to(`driver:${driver._id}`).emit("assign_driver", request);
    }

    res.status(200).json({
        success: true,
        message: "Driver assigned successfully 🚑",
        data: request,
    });
});