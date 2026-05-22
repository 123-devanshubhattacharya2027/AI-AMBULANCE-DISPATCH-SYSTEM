import asyncHandler from "express-async-handler";

import Driver from "../models/Driver.js";

import EmergencyRequest from "../models/EmergencyRequest.js";

import { REQUEST_STATUS } from "../constants/enums.js";

// ==========================================
// 🚑 CREATE DRIVER
// ==========================================
export const createDriver =
    asyncHandler(async (req, res) => {

        const {
            userId,
            vehicleNumber,
            location,
        } = req.body;

        // 🚨 VALIDATION
        if (!userId) {

            res.status(400);

            throw new Error(
                "userId is required"
            );
        }

        // 🚫 CHECK EXISTING
        const existingDriver =
            await Driver.findOne({
                user: userId,
            });

        if (existingDriver) {

            res.status(400);

            throw new Error(
                "Driver already exists"
            );
        }

        // 🚑 CREATE DRIVER
        const driver =
            await Driver.create({

                user: userId,

                vehicleNumber,

                location: {
                    type: "Point",

                    coordinates:
                        location || [0, 0],
                },

                isAvailable: true,
            });

        res.status(201).json({

            success: true,

            message:
                "Driver created successfully",

            data: driver,
        });
    });

// ==========================================
// 🚑 GET ALL DRIVERS
// ==========================================
export const getDrivers =
    asyncHandler(async (req, res) => {

        const drivers =
            await Driver.find()

                .populate(
                    "user",
                    "name email role"
                )

                .sort({
                    createdAt: -1,
                });

        res.status(200).json({

            success: true,

            count: drivers.length,

            data: {
                drivers,
            },
        });
    });

// ==========================================
// 🚑 GET DRIVER PROFILE
// ==========================================
export const getMyDriverProfile =
    asyncHandler(async (req, res) => {

        const driver =
            await Driver.findOne({
                user: req.user._id,
            })

                .populate(
                    "user",
                    "name email role"
                );

        if (!driver) {

            res.status(404);

            throw new Error(
                "Driver not found"
            );
        }

        res.status(200).json({

            success: true,

            data: driver,
        });
    });

// ==========================================
// 🚑 GET ASSIGNED REQUESTS
// ==========================================
export const getAssignedRequests =
    asyncHandler(async (req, res) => {

        // 🚑 FIND DRIVER
        const driver =
            await Driver.findOne({
                user: req.user._id,
            });

        if (!driver) {

            res.status(404);

            throw new Error(
                "Driver not found"
            );
        }

        // 🚨 FETCH REQUESTS
        const requests =
            await EmergencyRequest.find({

                assignedDriver:
                    driver._id,
            })

                .populate(
                    "user",
                    "name email phone"
                )

                .sort({
                    createdAt: -1,
                });

        res.status(200).json({

            success: true,

            count: requests.length,

            data: requests,
        });
    });

// ==========================================
// 🚑 UPDATE REQUEST STATUS
// ==========================================
export const updateRequestStatus =
    asyncHandler(async (req, res) => {

        const { id } = req.params;

        const { status } = req.body;

        // 🚑 FIND DRIVER
        const driver =
            await Driver.findOne({
                user: req.user._id,
            });

        if (!driver) {

            res.status(404);

            throw new Error(
                "Driver not found"
            );
        }

        // 🚨 FIND REQUEST
        const request =
            await EmergencyRequest.findById(
                id
            );

        if (!request) {

            res.status(404);

            throw new Error(
                "Request not found"
            );
        }

        // 🚫 AUTH CHECK
        if (

            !request.assignedDriver ||

            request.assignedDriver.toString()
            !== driver._id.toString()

        ) {

            res.status(403);

            throw new Error(
                "Not authorized for this request"
            );
        }

        // 🔥 UPDATE STATUS
        request.status = status;

        // 📝 HISTORY TRACK
        request.history.push({

            status,

            changedAt: new Date(),

            changedBy: req.user._id,
        });

        // 🚑 DRIVER AVAILABLE AGAIN
        if (
            status ===
            REQUEST_STATUS.COMPLETED
        ) {

            driver.isAvailable = true;

            await driver.save();
        }

        await request.save();

        // ==========================================
        // 🔥 SOCKET.IO REAL-TIME EVENTS
        // ==========================================
        const io = req.app.get("io");

        if (io) {

            // 👤 SEND TO USER
            io.to(
                `user:${request.user}`
            ).emit(
                "status_update",
                request
            );

            // 🚨 SEND TO ADMIN
            io.to("admin").emit(
                "status_update",
                request
            );

            // 🚑 SEND TO DRIVER
            io.to(
                `driver:${driver._id}`
            ).emit(
                "status_update",
                request
            );
        }

        res.status(200).json({

            success: true,

            message:
                "Request status updated",

            data: request,
        });
    });

// ==========================================
// 📍 UPDATE DRIVER LOCATION
// ==========================================
export const updateDriverLocation =
    asyncHandler(async (req, res) => {

        const {
            latitude,
            longitude,
        } = req.body;

        // 🚨 VALIDATION
        if (
            latitude === undefined ||
            longitude === undefined
        ) {

            res.status(400);

            throw new Error(
                "Latitude & Longitude required"
            );
        }

        // 🚑 FIND DRIVER
        const driver =
            await Driver.findOne({
                user: req.user._id,
            });

        if (!driver) {

            res.status(404);

            throw new Error(
                "Driver not found"
            );
        }

        // 📍 UPDATE LOCATION
        driver.location = {

            type: "Point",

            coordinates: [
                longitude,
                latitude,
            ],
        };

        await driver.save();

        // 🚨 FIND ACTIVE REQUEST
        const activeRequest =
            await EmergencyRequest.findOne({

                assignedDriver:
                    driver._id,

                status: {
                    $ne:
                        REQUEST_STATUS.COMPLETED,
                },
            });

        // ==========================================
        // 🔥 SOCKET.IO LOCATION UPDATE
        // ==========================================
        const io = req.app.get("io");

        if (io) {

            const payload = {

                driverId: driver._id,

                coordinates: [
                    latitude,
                    longitude,
                ],
            };

            // 🚨 ADMIN ROOM
            io.to("admin").emit(
                "location_update",
                payload
            );

            // 👤 USER ROOM
            if (activeRequest) {

                io.to(
                    `user:${activeRequest.user}`
                ).emit(
                    "location_update",
                    payload
                );
            }

            // 🚑 DRIVER ROOM
            io.to(
                `driver:${driver._id}`
            ).emit(
                "location_update",
                payload
            );
        }

        res.status(200).json({

            success: true,

            message:
                "Driver location updated",

            data: driver,
        });
    });

// ==========================================
// 🔁 TOGGLE AVAILABILITY
// ==========================================
export const toggleAvailability =
    asyncHandler(async (req, res) => {

        const driver =
            await Driver.findOne({
                user: req.user._id,
            });

        if (!driver) {

            res.status(404);

            throw new Error(
                "Driver not found"
            );
        }

        // 🔥 TOGGLE
        driver.isAvailable =
            !driver.isAvailable;

        await driver.save();

        res.status(200).json({

            success: true,

            message:
                `Driver is now ${driver.isAvailable
                    ? "AVAILABLE"
                    : "BUSY"
                }`,

            data: driver,
        });
    });