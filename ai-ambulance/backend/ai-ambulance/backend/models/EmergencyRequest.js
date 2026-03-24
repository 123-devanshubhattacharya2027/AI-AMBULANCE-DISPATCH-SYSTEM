import mongoose from "mongoose";
import { REQUEST_STATUS, EMERGENCY_TYPES } from "../constants/enums.js";

const emergencyRequestSchema = new mongoose.Schema(
  {
    // 👤 User who created request
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🚑 Assigned driver (null initially)
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    // 🚨 Type of emergency
    emergencyType: {
      type: String,
      enum: Object.values(EMERGENCY_TYPES),
      required: true,
    },

    // 📝 Description
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // 🌍 Location (GeoJSON format)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (val) {
            return val.length === 2;
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },

    // 📌 Current Status
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
    },

    // 📜 Status History (For Day 6 Status Machine)
    history: [
      {
        status: {
          type: String,
          enum: Object.values(REQUEST_STATUS),
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 🤖 AI Fields (Day 18 Ready)
    severityScore: {
      type: Number,
      default: 0,
    },

    fraudScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// 🌍 GEO INDEX for location search
emergencyRequestSchema.index({ location: "2dsphere" });

// ⚡ Index for faster filtering by status
emergencyRequestSchema.index({ status: 1 });

export default mongoose.model("EmergencyRequest", emergencyRequestSchema);