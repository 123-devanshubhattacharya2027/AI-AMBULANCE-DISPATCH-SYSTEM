import asyncHandler from "express-async-handler";
import Driver from "../models/Driver.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { REQUEST_STATUS } from "../constants/enums.js";

// ==========================================
// 🚑 CREATE DRIVER (Admin) ✅ FIXED
// ==========================================
export const createDriver = asyncHandler(async (req, res) => {
    const { userId, vehicleNumber, location } = req.body;

    if (!userId) {
        res.status(400);
        throw new Error("userId is required");
    }

    const existingDriver = await Driver.findOne({ user: userId });

    if (existingDriver) {
        res.status(400);
        throw new Error("Driver already exists");
    }

    const driver = await Driver.create({
        user: userId,
        vehicleNumber,
        location: {
            type: "Point",
            coordinates: location || [0, 0],
        },
        isAvailable: true,
    });

    res.status(201).json({
        success: true,
        message: "Driver created successfully",
        data: driver,
    });
});

// ==========================================
// 🚑 GET ALL DRIVERS (Admin)
// ==========================================
export const getDrivers = asyncHandler(async (req, res) => {
    const drivers = await Driver.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Drivers fetched successfully",
        data: { drivers },
    });
});

// ==========================================
// ✅ GET ASSIGNED REQUESTS (Driver) 🔥 FIXED
// ==========================================
export const getAssignedRequests = asyncHandler(async (req, res) => {
    // 🔥 FIND DRIVER USING USER ID
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
        res.status(404);
        throw new Error("Driver not found");
    }

    // 🔥 MATCH WITH DRIVER._id (NOT USER ID)
    const requests = await EmergencyRequest.find({
        assignedDriver: driver._id
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

    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
        res.status(404);
        throw new Error("Driver not found");
    }

    const request = await EmergencyRequest.findById(id);

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    // 🔥 FIX: CHECK USING DRIVER._id
    if (
        !request.assignedDriver ||
        request.assignedDriver.toString() !== driver._id.toString()
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

// ==========================================
// 👤 GET MY DRIVER PROFILE
// ==========================================
export const getMyDriverProfile = asyncHandler(async (req, res) => {
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
        res.status(404);
        throw new Error("Driver not found");
    }

    res.status(200).json({
        success: true,
        data: driver,
    });
});