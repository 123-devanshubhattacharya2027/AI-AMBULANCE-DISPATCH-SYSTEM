import mongoose from "mongoose";
import { AMBULANCE_TYPE } from "../utils/constants.js";

const driverSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Driver must be linked to a User record"],
      unique: true,
      index: true,
    },

    ambulanceType: {
      type: String,
      enum: Object.values(AMBULANCE_TYPE),
      default: AMBULANCE_TYPE.BLS,
    },

    onDuty: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: [true, "Location type is required"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are mandatory"],
        
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              Number.isFinite(coords[0]) &&
              Number.isFinite(coords[1]) &&
              coords[0] >= -180 &&
              coords[0] <= 180 && 
              coords[1] >= -90 &&
              coords[1] <= 90 
            );
          },
          message: "Coordinates must be a valid [longitude, latitude] pair",
        },
      },
    },

    avgResponseTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },

    activeRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmergencyRequest",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


driverSchema.index({ currentLocation: "2dsphere" });

export const Driver = mongoose.model("Driver", driverSchema);
export default Driver;