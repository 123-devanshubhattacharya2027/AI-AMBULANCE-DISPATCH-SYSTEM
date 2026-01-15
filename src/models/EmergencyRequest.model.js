import mongoose from "mongoose";
import {
  REQUEST_STATUS,
  SEVERITY_LEVEL,
  AMBULANCE_TYPE,
} from "../utils/constants.js";

const emergencyRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required to create an emergency request"],
      index: true,
    },

    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
      index: true,
    },

    emergencyType: {
      type: String,
      required: [true, "Emergency type is required (e.g., Cardiac, Accident)"],
      trim: true,
      index: true,
    },

    descriptionText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
      index: true,
    },

  
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: [true, "Location type is required"],
      },
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are mandatory for dispatch"],
        validate: {
          validator: function (coords) {
           
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              Number.isFinite(coords[0]) &&
              Number.isFinite(coords[1]) &&
              coords[0] >= -180 &&
              coords[1] >= -90 &&
              coords[1] <= 90 
            );
          },
          message: "Location coordinates must be valid [longitude, latitude]",
        },
      },
      required: [true, "Location is required for dispatch"],
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    
    ai: {
      type: {
        emergencyCategory: { type: String, default: "", trim: true },
        severity: {
          type: String,
          enum: Object.values(SEVERITY_LEVEL),
          default: SEVERITY_LEVEL.LOW,
          index: true,
        },
        priorityScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
          index: true,
        },
        ambulanceTypeRecommended: {
          type: String,
          enum: Object.values(AMBULANCE_TYPE),
          default: AMBULANCE_TYPE.BLS,
        },
        aiSummary: { type: String, default: "", trim: true, maxlength: 300 },
        aiRaw: { type: mongoose.Schema.Types.Mixed, default: null },
      },
      default: {},
    },

    
    fraud: {
      type: {
        fraudScore: { type: Number, default: 0, min: 0, max: 100, index: true },
        flagged: { type: Boolean, default: false, index: true },
        fraudReason: { type: String, default: "", trim: true },
      },
      default: {},
    },

    dispatchedAt: Date,
    enrouteAt: Date,
    arrivedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


emergencyRequestSchema.index({ location: "2dsphere" });

export const EmergencyRequest = mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
);
export default EmergencyRequest;