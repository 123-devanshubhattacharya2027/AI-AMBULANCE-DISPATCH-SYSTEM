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
                .select("status emergencyType createdAt user assignedDriver")
                .populate("user", "name email")
                .populate({
                    path: "assignedDriver",
                    select: "user",
                    populate: {
                        path: "user",
                        select: "name email"
                    }
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
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================
// ✅ GET SINGLE REQUEST (Admin)
// ==========================================
export const getRequestById = async (req, res) => {
    try {
        const request = await EmergencyRequest.findById(req.params.id)
            .select("status emergencyType description location user assignedDriver createdAt")
            .populate("user", "name email phone")
            .populate({
                path: "assignedDriver",
                select: "user",
                populate: {
                    path: "user",
                    select: "name email phone"
                }
            })
            .lean();

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        res.json({
            success: true,
            data: request,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================
// 🚑 ASSIGN DRIVER (Day 10)
// ==========================================
export const assignDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { driverId } = req.body;

        // 🔹 Validate input
        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: "Driver ID is required",
            });
        }

        // 🔹 Find request
        const request = await EmergencyRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        // 🔹 Only PENDING requests allowed
        if (request.status !== REQUEST_STATUS.PENDING) {
            return res.status(400).json({
                success: false,
                message: "Only PENDING requests can be assigned",
            });
        }

        // 🔹 Find driver
        const driver = await Driver.findById(driverId).populate("user");

        if (!driver || !driver.isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Driver not available",
            });
        }

        // 🔹 Assign driver
        request.assignedDriver = driver._id;
        request.status = REQUEST_STATUS.DISPATCHED;

        // 🔹 Update history
        request.history.push({
            status: REQUEST_STATUS.DISPATCHED,
            changedAt: new Date(),
        });

        await request.save();

        // 🔹 Make driver unavailable
        driver.isAvailable = false;
        await driver.save();

        // 🔥 SOCKET EMIT
        const io = req.app.get("io");

        if (io) {
            io.to(`driver:${driver._id}`).emit("new_assignment", {
                requestId: request._id,
                emergencyType: request.emergencyType,
                location: request.location,
                description: request.description,
            });

            io.to("admin").emit("request_assigned", {
                requestId: request._id,
                driverId: driver._id,
                driverName: driver.user?.name,
            });
        }

        res.json({
            success: true,
            message: "🚑 Driver assigned successfully",
            data: request,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};