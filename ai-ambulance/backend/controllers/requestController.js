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
            history: [
                {
                    status: "PENDING",
                    changedAt: new Date(),
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
// ✅ UPDATE REQUEST STATUS (Day 6)
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

        // 🚫 Role restriction — USER can only cancel PENDING
        if (req.user.role === "USER") {
            if (status !== "CANCELLED" || currentStatus !== "PENDING") {
                return res.status(403).json({
                    success: false,
                    message: "Users can only cancel pending requests",
                });
            }
        }

        // 🚫 Check if transition allowed
        if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${currentStatus} to ${status}`,
            });
        }

        // ✅ Update status
        request.status = status;

        // 📜 Add history entry
        request.history.push({
            status,
            changedAt: new Date(),
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