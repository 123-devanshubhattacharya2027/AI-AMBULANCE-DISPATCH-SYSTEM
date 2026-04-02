import mongoose from "mongoose";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Driver from "../models/Driver.js";
import { REQUEST_STATUS } from "../constants/enums.js";


// ==========================================
// ✅ GET ALL REQUESTS (Admin)
// ==========================================
export const getAllRequests = async (req, res) => {
    try {
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

        res.json({
            success: true,
            count: requests.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            data: requests,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// ✅ GET SINGLE REQUEST
// ==========================================
export const getRequestById = async (req, res) => {
    try {
        const request = await EmergencyRequest.findById(req.params.id)
            .populate("user", "name email phone")
            .populate({
                path: "assignedDriver",
                populate: { path: "user", select: "name email phone" }
            })
            .lean();

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        res.json({ success: true, data: request });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// 🚑 ASSIGN DRIVER (MANUAL)
// ==========================================
export const assignDriver = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { driverId } = req.body;

        const request = await EmergencyRequest.findById(id).session(session);
        if (!request) throw new Error("Request not found");

        if (request.status !== REQUEST_STATUS.PENDING) {
            throw new Error("Only PENDING requests can be assigned");
        }

        const driver = await Driver.findById(driverId).session(session);

        if (!driver || !driver.isAvailable) {
            throw new Error("Driver not available");
        }

        // ✅ Assign
        request.assignedDriver = driver._id;
        request.status = REQUEST_STATUS.DISPATCHED;

        if (!request.timeline) request.timeline = [];

        request.timeline.push({
            status: REQUEST_STATUS.DISPATCHED,
            updatedAt: new Date(),
        });

        // ✅ Driver OFF
        driver.isAvailable = false;

        await request.save({ session });
        await driver.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 🔥 Socket
        const io = req.app.get("io");

        if (io) {
            io.to(`driver:${driver._id}`).emit("new_assignment", request);
            io.to("admin").emit("request_assigned", request);
        }

        res.json({
            success: true,
            message: "Driver assigned successfully 🚑",
            data: request,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({ success: false, message: error.message });
    }
};


// ==========================================
// 🚀 SMART GEO DRIVER ASSIGNMENT (AUTO)
// ==========================================
export const autoAssignDriver = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        // 1️⃣ Request
        const request = await EmergencyRequest.findById(id).session(session);

        if (!request) throw new Error("Request not found");

        if (request.assignedDriver) {
            throw new Error("Driver already assigned");
        }

        const coordinates = request.location.coordinates;

        // 2️⃣ Find nearest driver
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
            throw new Error("No nearby drivers available");
        }

        // 3️⃣ Assign
        request.assignedDriver = nearestDriver._id;
        request.status = REQUEST_STATUS.DISPATCHED;

        if (!request.timeline) request.timeline = [];

        request.timeline.push({
            status: REQUEST_STATUS.DISPATCHED,
            updatedAt: new Date(),
            note: "Auto-assigned nearest driver",
        });

        // 4️⃣ Driver OFF
        nearestDriver.isAvailable = false;

        await request.save({ session });
        await nearestDriver.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 🔥 Socket
        const io = req.app.get("io");

        if (io) {
            io.to(`driver:${nearestDriver._id}`).emit("new_assignment", request);
            io.to("admin").emit("auto_dispatch", request);
        }

        res.json({
            success: true,
            message: "Nearest driver auto-assigned 🚑",
            data: {
                request,
                driver: nearestDriver,
            },
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({ success: false, message: error.message });
    }
};