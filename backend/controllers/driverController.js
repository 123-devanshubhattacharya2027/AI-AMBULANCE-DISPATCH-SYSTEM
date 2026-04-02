import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { REQUEST_STATUS } from "../constants/enums.js";

import {
    isValidTransition,
    canCancel,
    isTerminalStatus
} from "../utils/statusFlow.js";


// ==========================================
// ✅ CREATE DRIVER
// ==========================================
export const createDriver = async (req, res) => {
    try {
        const { name, email, password, vehicleNumber, coordinates } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Driver already exists",
            });
        }

        if (!coordinates || coordinates.length !== 2) {
            return res.status(400).json({
                success: false,
                message: "Coordinates required [lng, lat]",
            });
        }

        if (!vehicleNumber) {
            return res.status(400).json({
                success: false,
                message: "Vehicle number is required",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "DRIVER",
        });

        const driver = await Driver.create({
            user: user._id,
            vehicleNumber,
            isAvailable: true,
            location: {
                type: "Point",
                coordinates: [Number(coordinates[0]), Number(coordinates[1])],
            },
        });

        res.status(201).json({
            success: true,
            message: "Driver created successfully 🚑",
            data: { user, driver },
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// ✅ GET DRIVER PROFILE
// ==========================================
export const getMyDriverProfile = async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user._id })
            .populate("user", "name email")
            .lean();

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        res.json({ success: true, data: driver });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// ✅ UPDATE DRIVER LIVE LOCATION (WITH SOCKET LOG)
// ==========================================
export const updateDriverLocation = async (req, res) => {
    try {
        const { coordinates } = req.body;

        // Validate input
        if (!coordinates || coordinates.length !== 2) {
            return res.status(400).json({
                success: false,
                message: "Coordinates required [lng, lat]",
            });
        }

        const [lng, lat] = coordinates.map(Number);

        if (isNaN(lng) || isNaN(lat)) {
            return res.status(400).json({
                success: false,
                message: "Invalid coordinates",
            });
        }

        // Update location
        const driver = await Driver.findOneAndUpdate(
            { user: req.user._id },
            {
                location: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
            },
            { new: true, runValidators: true }
        );

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        // Socket emit
        const io = req.app.get("io");

        if (io) {
            const payload = {
                driverId: driver._id,
                coordinates: driver.location.coordinates,
                updatedAt: new Date(),
            };

            // ✅ STEP 6.9 — DEBUG LOG
            console.log("📡 Emitting location_update:", payload);

            io.to("admin").emit("location_update", payload);
            io.emit(`driver:${driver._id}:location`, payload);
        }

        res.json({
            success: true,
            message: "Live location updated 🚑",
            data: driver.location,
        });

    } catch (error) {
        console.error("ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================
// ✅ GET ALL ASSIGNED REQUESTS
// ==========================================
export const getAssignedRequests = async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user._id });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        const requests = await EmergencyRequest.find({
            assignedDriver: driver._id,
        })
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: requests });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// ✅ GET ACTIVE REQUEST
// ==========================================
export const getAssignedRequest = async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user._id });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        const request = await EmergencyRequest.findOne({
            assignedDriver: driver._id,
            status: {
                $in: [
                    REQUEST_STATUS.DISPATCHED,
                    REQUEST_STATUS.ENROUTE,
                    REQUEST_STATUS.ARRIVED,
                    REQUEST_STATUS.PICKED_UP,
                ],
            },
        })
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .lean();

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "No active request",
            });
        }

        res.json({ success: true, data: request });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// ✅ TOGGLE AVAILABILITY
// ==========================================
export const toggleAvailability = async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user._id });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        driver.isAvailable = !driver.isAvailable;
        await driver.save();

        res.json({
            success: true,
            message: `Availability: ${driver.isAvailable ? "ONLINE" : "OFFLINE"}`,
            data: driver,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};