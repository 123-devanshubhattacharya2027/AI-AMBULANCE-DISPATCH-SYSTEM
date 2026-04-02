import mongoose from "mongoose";
import { REQUEST_STATUS, EMERGENCY_TYPES } from "../constants/enums.js";

const emergencyRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    emergencyType: {
      type: String,
      enum: Object.values(EMERGENCY_TYPES),
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (val) {
            return val.length === 2;
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },

    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
    },

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

    severityScore: {
      type: Number,
      default: 0,
    },

    fraudScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,

    // ✅ STEP 6 OPTIMIZATION (IMPORTANT)
    toJSON: { versionKey: false },
    toObject: { versionKey: false },
  }
);

// 🌍 GEO INDEX (for Day 18 - AI)
emergencyRequestSchema.index({ location: "2dsphere" });

// ⚡ DAY 9 OPTIMIZED INDEX (IMPORTANT)
emergencyRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("EmergencyRequest", emergencyRequestSchema);