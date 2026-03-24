import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { REQUEST_STATUS } from "../constants/enums.js";


// ==========================================
// ✅ CREATE DRIVER (Admin creates user + profile)
// ==========================================
export const createDriver = async (req, res) => {
    try {
        const { name, email, password, vehicleNumber, coordinates } = req.body;

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Driver already exists",
            });
        }

        // Validate coordinates
        if (!coordinates || coordinates.length !== 2) {
            return res.status(400).json({
                success: false,
                message: "Driver coordinates are required [longitude, latitude]",
            });
        }

        if (!vehicleNumber) {
            return res.status(400).json({
                success: false,
                message: "Vehicle number is required",
            });
        }

        // Create user with DRIVER role
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "DRIVER",
        });

        // Create driver profile with vehicle & location
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
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                driver,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================
// ✅ GET MY DRIVER PROFILE
// ==========================================
export const getMyDriverProfile = async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user._id }).populate(
            "user",
            "name email"
        );

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        res.json({
            success: true,
            data: driver,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================
// ✅ UPDATE DRIVER LOCATION (Real-time GPS)
// ==========================================
export const updateDriverLocation = async (req, res) => {
    try {
        const { coordinates } = req.body;

        if (!coordinates || coordinates.length !== 2) {
            return res.status(400).json({
                success: false,
                message: "Coordinates are required [longitude, latitude]",
            });
        }

        const driver = await Driver.findOne({ user: req.user._id });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        driver.location = {
            type: "Point",
            coordinates: [Number(coordinates[0]), Number(coordinates[1])],
        };

        await driver.save();

        // Emit real-time location update via socket
        const io = req.app.get("io");
        if (io) {
            io.emit(`driver:${req.user._id}:location`, {
                driverId: driver._id,
                coordinates: driver.location.coordinates,
                updatedAt: new Date(),
            });
        }

        res.json({
            success: true,
            message: "Location updated successfully 📍",
            data: driver,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================
// ✅ TOGGLE DRIVER AVAILABILITY
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
            message: `Availability set to ${driver.isAvailable ? "ONLINE ✅" : "OFFLINE ❌"}`,
            data: { isAvailable: driver.isAvailable },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================
// ✅ GET ASSIGNED REQUESTS (Driver sees their jobs)
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

        const { active } = req.query;

        const filter = { assignedDriver: driver._id };

        if (active === "true") {
            // Only show in-progress requests
            filter.status = {
                $in: [
                    REQUEST_STATUS.DISPATCHED,
                    REQUEST_STATUS.ENROUTE,
                    REQUEST_STATUS.ARRIVED,
                    REQUEST_STATUS.PICKED_UP,
                ],
            };
        }

        const requests = await EmergencyRequest.find(filter)
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};