import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        vehicleNumber: {
            type: String,
            required: true
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
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
        }
    },
    { timestamps: true }
);

// 🌍 GEO INDEX
driverSchema.index({ location: "2dsphere" });

export default mongoose.model("Driver", driverSchema);