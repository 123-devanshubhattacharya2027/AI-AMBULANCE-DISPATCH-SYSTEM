import mongoose from "mongoose";
import { REQUEST_STATUS, EMERGENCY_TYPES } from "../constants/enums.js";

const emergencyRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assignedDriver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver"
        },
        emergencyType: {
            type: String,
            enum: Object.values(EMERGENCY_TYPES),
            required: true
        },
        description: String,

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        },

        status: {
            type: String,
            enum: Object.values(REQUEST_STATUS),
            default: REQUEST_STATUS.PENDING
        },

        severityScore: {
            type: Number,
            default: 0
        },

        fraudScore: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// 🌍 GEO INDEX
emergencyRequestSchema.index({ location: "2dsphere" });

export default mongoose.model("EmergencyRequest", emergencyRequestSchema);