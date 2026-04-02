import asyncHandler from "express-async-handler";
import Driver from "../models/Driver.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { REQUEST_STATUS } from "../constants/enums.js";

// ==========================================
// ✅ GET ASSIGNED REQUESTS (Driver)
// ==========================================
export const getAssignedRequests = asyncHandler(async (req, res) => {
    const driverId = req.user._id;

    const requests = await EmergencyRequest.find({
        assignedDriver: driverId
    })
        .populate("user", "name email phone")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Assigned requests fetched successfully",
        data: requests
    });
});


// ==========================================
// 🚑 UPDATE REQUEST STATUS (Driver)
// ==========================================
export const updateRequestStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const request = await EmergencyRequest.findById(id);

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    // 🔐 Ensure driver is assigned
    if (
        !request.assignedDriver ||
        request.assignedDriver.toString() !== req.user._id.toString()
    ) {
        res.status(403);
        throw new Error("Not authorized for this request");
    }

    request.status = status;

    request.history.push({
        status,
        changedAt: new Date(),
        changedBy: req.user._id,
    });

    await request.save();

    // 🔥 Emit updates
    const io = req.app.get("io");
    if (io) {
        io.emit("status_update", request);
        io.to(`user:${request.user}`).emit("status_update", request);
    }

    res.status(200).json({
        success: true,
        message: "Request status updated successfully",
        data: request
    });
});


// ==========================================
// 📍 UPDATE DRIVER LOCATION
// ==========================================
export const updateDriverLocation = asyncHandler(async (req, res) => {
    const { coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
        res.status(400);
        throw new Error("Valid coordinates required");
    }

    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
        res.status(404);
        throw new Error("Driver not found");
    }

    driver.location = {
        type: "Point",
        coordinates
    };

    await driver.save();

    // 🔥 Emit live location
    const io = req.app.get("io");
    if (io) {
        io.to("admin").emit("location_update", {
            driverId: driver._id,
            coordinates
        });
    }

    res.status(200).json({
        success: true,
        message: "Location updated successfully",
        data: driver
    });
});


// ==========================================
// 🟢 TOGGLE DRIVER AVAILABILITY
// ==========================================
export const toggleAvailability = asyncHandler(async (req, res) => {
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
        res.status(404);
        throw new Error("Driver not found");
    }

    driver.isAvailable = !driver.isAvailable;

    await driver.save();

    res.status(200).json({
        success: true,
        message: "Driver availability updated successfully",
        data: driver
    });
});