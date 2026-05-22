import asyncHandler from "express-async-handler";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Driver from "../models/Driver.js";
import { analyzeEmergency } from "../Services/ai.service.js";

// ==========================================
// 🚑 CREATE REQUEST
// ==========================================
export const createRequest = asyncHandler(
    async (req, res) => {

        try {

            const {
                emergencyType,
                description,
                location,
            } = req.body;

            // 🧠 AI ANALYSIS
            const aiResult =
                await analyzeEmergency({
                    emergencyType,
                    description,
                });

            // 🚑 FIND AVAILABLE DRIVER
            const nearestDriver =
                await Driver.findOne({
                    isAvailable: true,
                });

            // 🚨 CREATE REQUEST
            const request =
                await EmergencyRequest.create({

                    user: req.user._id,

                    emergencyType,

                    description,

                    location,

                    severity:
                        aiResult.severity,

                    priority:
                        aiResult.priority,

                    aiSummary:
                        aiResult.summary,

                    assignedDriver:
                        nearestDriver
                            ? nearestDriver._id
                            : null,

                    status:
                        nearestDriver
                            ? "DISPATCHED"
                            : "PENDING",
                });

            // 🚫 DRIVER BUSY
            if (nearestDriver) {

                nearestDriver.isAvailable =
                    false;

                await nearestDriver.save();
            }

            res.status(201).json({

                success: true,

                message:
                    "Emergency request created",

                data: request,
            });

        } catch (error) {

            console.error(
                "❌ CREATE REQUEST ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to create request",
            });
        }
    }
);

// ==========================================
// 👤 GET MY REQUESTS
// ==========================================
export const getMyRequests = asyncHandler(
    async (req, res) => {

        const requests =
            await EmergencyRequest.find({
                user: req.user._id,
            }).sort({
                createdAt: -1,
            });

        res.status(200).json({

            success: true,

            data: {
                requests,
            },
        });
    }
);

// ==========================================
// 🚨 GET ALL REQUESTS (ADMIN)
// ==========================================
export const getAllRequests = asyncHandler(
    async (req, res) => {

        const requests =
            await EmergencyRequest.find()

                .populate(
                    "user",
                    "name email"
                )

                .populate({
                    path: "assignedDriver",

                    populate: {
                        path: "user",
                        select: "name email",
                    },
                })

                .sort({
                    createdAt: -1,
                });

        res.status(200).json({

            success: true,

            count: requests.length,

            data: {
                requests,
            },
        });
    }
);

// ==========================================
// 🚑 ASSIGN DRIVER
// ==========================================
export const assignDriver = asyncHandler(
    async (req, res) => {

        const request =
            await EmergencyRequest.findById(
                req.params.id
            );

        if (!request) {

            return res.status(404).json({
                success: false,
                message:
                    "Request not found",
            });
        }

        request.assignedDriver =
            req.body.driverId;

        request.status =
            "DISPATCHED";

        await request.save();

        res.status(200).json({

            success: true,

            message:
                "Driver assigned",

            data: request,
        });
    }
);

// ==========================================
// 🔄 UPDATE STATUS
// ==========================================
export const updateRequestStatus =
    asyncHandler(async (req, res) => {

        const request =
            await EmergencyRequest.findById(
                req.params.id
            );

        if (!request) {

            return res.status(404).json({
                success: false,
                message:
                    "Request not found",
            });
        }

        request.status =
            req.body.status ||
            request.status;

        await request.save();

        res.status(200).json({

            success: true,

            message:
                "Status updated",

            data: request,
        });
    });

// ==========================================
// ❌ CANCEL REQUEST
// ==========================================
export const cancelRequest =
    asyncHandler(async (req, res) => {

        const request =
            await EmergencyRequest.findById(
                req.params.id
            );

        if (!request) {

            return res.status(404).json({
                success: false,
                message:
                    "Request not found",
            });
        }

        request.status = "CANCELLED";

        await request.save();

        res.status(200).json({

            success: true,

            message:
                "Request cancelled",
        });
    });

