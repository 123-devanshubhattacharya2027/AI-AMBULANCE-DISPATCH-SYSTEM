import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        vehicleNumber: {
            type: String,
            required: true,
            trim: true
        },

        isAvailable: {
            type: Boolean,
            default: true,
            index: true
        },

        // ⭐ STEP 2.1 — DRIVER RATING (AI scoring)
        rating: {
            type: Number,
            default: 4.5,
            min: 1,
            max: 5
        },

        // ⏱️ STEP 2.1 — RESPONSE TIME (minutes)
        responseTime: {
            type: Number,
            default: 5 // average response time
        },

        // 🌍 GEO LOCATION
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
                required: true
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
                default: [0, 0],
                validate: {
                    validator: function (val) {
                        return (
                            val.length === 2 &&
                            val[0] >= -180 &&
                            val[0] <= 180 &&
                            val[1] >= -90 &&
                            val[1] <= 90
                        );
                    },
                    message: "Coordinates must be [lng, lat]"
                }
            }
        }
    },
    { timestamps: true }
);

// 🌍 GEO INDEX
driverSchema.index({ location: "2dsphere" });

// ⚡ COMPOUND INDEX (OPTIMIZED)
driverSchema.index({
    isAvailable: 1,
    location: "2dsphere"
});

export default mongoose.model("Driver", driverSchema);