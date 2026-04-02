import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Driver from "../models/Driver.js";
import { REQUEST_STATUS } from "../constants/enums.js";

// ==========================================
// ✅ GET ALL REQUESTS (Admin)
// ==========================================
export const getAllRequests = asyncHandler(async (req, res) => {
    const {
        status,
        emergencyType,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        order = "desc"
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (emergencyType) filter.emergencyType = emergencyType;

    const sortOrder = order === "asc" ? 1 : -1;

    const [requests, total] = await Promise.all([
        EmergencyRequest.find(filter)
            .populate("user", "name email")
            .populate({
                path: "assignedDriver",
                populate: { path: "user", select: "name email" }
            })
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limitNum)
            .lean(),

        EmergencyRequest.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        message: "Requests fetched successfully",
        data: {
            count: requests.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            requests
        },
    });
});


// ==========================================
// ✅ GET SINGLE REQUEST
// ==========================================
export const getRequestById = asyncHandler(async (req, res) => {
    const request = await EmergencyRequest.findById(req.params.id)
        .populate("user", "name email phone")
        .populate({
            path: "assignedDriver",
            populate: { path: "user", select: "name email phone" }
        })
        .lean();

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    res.status(200).json({
        success: true,
        message: "Request fetched successfully",
        data: request
    });
});


// ==========================================
// 🚑 ASSIGN DRIVER (MANUAL - ADVANCED)
// ==========================================
export const assignDriver = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { driverId } = req.body;

        const request = await EmergencyRequest.findById(id).session(session);
        if (!request) {
            res.status(404);
            throw new Error("Request not found");
        }

        if (request.status !== REQUEST_STATUS.PENDING) {
            res.status(400);
            throw new Error("Only PENDING requests can be assigned");
        }

        const driver = await Driver.findById(driverId).session(session);

        if (!driver || !driver.isAvailable) {
            res.status(400);
            throw new Error("Driver not available");
        }

        request.assignedDriver = driver._id;
        request.status = REQUEST_STATUS.DISPATCHED;

        if (!request.timeline) request.timeline = [];

        request.timeline.push({
            status: REQUEST_STATUS.DISPATCHED,
            updatedAt: new Date(),
        });

        driver.isAvailable = false;

        await request.save({ session });
        await driver.save({ session });

        await session.commitTransaction();
        session.endSession();

        const io = req.app.get("io");

        if (io) {
            io.to(`driver:${driver._id}`).emit("new_assignment", request);
            io.to("admin").emit("request_assigned", request);
        }

        res.status(200).json({
            success: true,
            message: "Driver assigned successfully",
            data: request,
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err; // 🔥 IMPORTANT (not next(err))
    }
});


// ==========================================
// 🚀 SIMPLE ASSIGN DRIVER
// ==========================================
export const assignDriverSimple = asyncHandler(async (req, res) => {
    const request = await EmergencyRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    request.assignedDriver = req.body.driverId;
    request.status = REQUEST_STATUS.DISPATCHED;

    await request.save();

    const io = req.app.get("io");
    if (io) {
        io.to(`driver:${req.body.driverId}`).emit("assign_driver", request);
    }

    res.status(200).json({
        success: true,
        message: "Driver assigned successfully",
        data: request
    });
});


// ==========================================
// 🚀 AUTO ASSIGN DRIVER
// ==========================================
export const autoAssignDriver = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const request = await EmergencyRequest.findById(id).session(session);

        if (!request) {
            res.status(404);
            throw new Error("Request not found");
        }

        if (request.assignedDriver) {
            res.status(400);
            throw new Error("Driver already assigned");
        }

        const coordinates = request.location.coordinates;

        const nearestDriver = await Driver.findOne({
            isAvailable: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: coordinates,
                    },
                    $maxDistance: 5000
                }
            }
        }).session(session);

        if (!nearestDriver) {
            res.status(404);
            throw new Error("No nearby drivers available");
        }

        request.assignedDriver = nearestDriver._id;
        request.status = REQUEST_STATUS.DISPATCHED;

        if (!request.timeline) request.timeline = [];

        request.timeline.push({
            status: REQUEST_STATUS.DISPATCHED,
            updatedAt: new Date(),
            note: "Auto-assigned nearest driver",
        });

        nearestDriver.isAvailable = false;

        await request.save({ session });
        await nearestDriver.save({ session });

        await session.commitTransaction();
        session.endSession();

        const io = req.app.get("io");

        if (io) {
            io.to(`driver:${nearestDriver._id}`).emit("new_assignment", request);
            io.to("admin").emit("auto_dispatch", request);
        }

        res.status(200).json({
            success: true,
            message: "Nearest driver auto-assigned",
            data: {
                request,
                driver: nearestDriver,
            },
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err; // 🔥 important
    }
});