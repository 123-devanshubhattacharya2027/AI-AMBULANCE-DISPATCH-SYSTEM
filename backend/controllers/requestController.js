import EmergencyRequest from "../models/EmergencyRequest.js";
import { ALLOWED_TRANSITIONS } from "../constants/statusTransitions.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

// ==========================================
// ✅ CREATE EMERGENCY REQUEST
// ==========================================
export const createRequest = asyncHandler(async (req, res) => {
    const { emergencyType, description, location } = req.body;

    if (!location || !location.coordinates) {
        res.status(400);
        throw new Error("Location coordinates are required");
    }

    const [longitude, latitude] = location.coordinates;

    const request = await EmergencyRequest.create({
        user: req.user.id,
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
    io.to("admin").emit("new_request", request);

    res.status(201).json({
        success: true,
        message: "Emergency request created successfully",
        data: request,
    });
});


// ==========================================
// ✅ GET MY REQUESTS
// ==========================================
export const getMyRequests = asyncHandler(async (req, res) => {
    const requests = await EmergencyRequest.find({
        user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "User requests fetched successfully",
        data: {
            count: requests.length,
            requests
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
    const userRole = req.user.role;

    if (["COMPLETED", "CANCELLED"].includes(currentStatus)) {
        res.status(400);
        throw new Error(`Cannot update a ${currentStatus} request`);
    }

    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    // 🔐 Cancellation rules
    if (status === "CANCELLED") {
        if (currentStatus === "PENDING" && userRole !== "USER") {
            res.status(403);
            throw new Error("Only user can cancel a PENDING request");
        }

        if (currentStatus === "DISPATCHED" && userRole !== "ADMIN") {
            res.status(403);
            throw new Error("Only admin can cancel a DISPATCHED request");
        }

        if (!["PENDING", "DISPATCHED"].includes(currentStatus)) {
            res.status(400);
            throw new Error("Cannot cancel at this stage");
        }
    }

    // 🚑 Driver rules
    if (["ENROUTE", "ARRIVED", "PICKED_UP", "COMPLETED"].includes(status)) {
        if (userRole !== "DRIVER") {
            res.status(403);
            throw new Error("Only assigned driver can update travel status");
        }

        if (!request.assignedDriver) {
            res.status(403);
            throw new Error("No driver assigned to this request");
        }

        if (request.assignedDriver.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Driver not assigned to this request");
        }
    }

    request.status = status;

    request.history.push({
        status,
        changedAt: new Date(),
        changedBy: req.user._id,
    });

    await request.save();

    const io = req.app.get("io");
    io.emit("status_update", request);
    io.to(`user:${request.user}`).emit("status_update", request);

    res.status(200).json({
        success: true,
        message: "Request status updated successfully",
        data: request,
    });
});


// ==========================================
// ✅ ASSIGN DRIVER (ADMIN)
// ==========================================
export const assignDriver = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { driverId } = req.body;

    const request = await EmergencyRequest.findById(id);

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    const driver = await User.findById(driverId);

    if (!driver) {
        res.status(404);
        throw new Error("Driver not found");
    }

    if (driver.role !== "DRIVER") {
        res.status(400);
        throw new Error("Assigned user is not a driver");
    }

    if (request.status !== "PENDING") {
        res.status(400);
        throw new Error("Driver can only be assigned to PENDING requests");
    }

    request.assignedDriver = driverId;
    request.status = "DISPATCHED";

    request.history.push({
        status: "DISPATCHED",
        changedAt: new Date(),
        changedBy: req.user._id,
    });

    await request.save();

    const io = req.app.get("io");
    io.to(`driver:${driverId}`).emit("assign_driver", request);

    res.status(200).json({
        success: true,
        message: "Driver assigned successfully",
        data: request,
    });
});