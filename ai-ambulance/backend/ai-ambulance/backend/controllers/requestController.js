import EmergencyRequest from "../models/EmergencyRequest.js";
import { ALLOWED_TRANSITIONS } from "../constants/statusTransitions.js";

// ==========================================
// ✅ CREATE EMERGENCY REQUEST
// ==========================================
export const createRequest = async (req, res) => {
    try {
        const { emergencyType, description, location } = req.body;

        // Validate location
        if (!location || !location.coordinates) {
            return res.status(400).json({
                success: false,
                message: "Location coordinates are required",
            });
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

        res.status(201).json({
            success: true,
            message: "Emergency request created successfully",
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
// ✅ GET MY REQUESTS (User only)
// ==========================================
export const getMyRequests = async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({
            user: req.user.id,
        }).sort({ createdAt: -1 });

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

// ==========================================
// ✅ UPDATE REQUEST STATUS (Phase 5 Final)
// ==========================================
export const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await EmergencyRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        const currentStatus = request.status;
        const userRole = req.user.role;

        // 🚫 Prevent updates after final states
        if (["COMPLETED", "CANCELLED"].includes(currentStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot update a ${currentStatus} request`,
            });
        }

        // 🚫 Validate transition using state machine
        if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${currentStatus} to ${status}`,
            });
        }

        // ===============================
        // 🔐 CANCELLATION RULES
        // ===============================
        if (status === "CANCELLED") {

            // USER can cancel only PENDING
            if (currentStatus === "PENDING" && userRole !== "USER") {
                return res.status(403).json({
                    success: false,
                    message: "Only user can cancel a PENDING request",
                });
            }

            // ADMIN can cancel only DISPATCHED
            if (currentStatus === "DISPATCHED" && userRole !== "ADMIN") {
                return res.status(403).json({
                    success: false,
                    message: "Only admin can cancel a DISPATCHED request",
                });
            }

            // Block cancellation at later stages
            if (!["PENDING", "DISPATCHED"].includes(currentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot cancel at this stage",
                });
            }
        }

        // ===============================
        // 🚑 DRIVER STATUS RULES
        // ===============================
        if (["ENROUTE", "ARRIVED", "PICKED_UP", "COMPLETED"].includes(status)) {

            if (userRole !== "DRIVER") {
                return res.status(403).json({
                    success: false,
                    message: "Only assigned driver can update travel status",
                });
            }

            if (!request.assignedDriver) {
                return res.status(403).json({
                    success: false,
                    message: "No driver assigned to this request",
                });
            }

            if (request.assignedDriver.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Driver not assigned to this request",
                });
            }
        }

        // ===============================
        // ✅ Update Status
        // ===============================
        request.status = status;

        // 📜 Add history log
        request.history.push({
            status,
            changedAt: new Date(),
            changedBy: req.user._id,
        });

        await request.save();

        res.json({
            success: true,
            message: "Status updated successfully",
            data: request,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};