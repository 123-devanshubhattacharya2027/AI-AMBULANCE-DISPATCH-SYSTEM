import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true // ⚡ faster lookup
        },

        vehicleNumber: {
            type: String,
            required: true,
            trim: true
        },

        isAvailable: {
            type: Boolean,
            default: true,
            index: true // ⚡ used in geo queries
        },

        // 🌍 GEO LOCATION (STEP 4.1 IMPROVED)
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
                validate: {
                    validator: function (val) {
                        return val.length === 2;
                    },
                    message: "Coordinates must be [longitude, latitude]"
                }
            }
        }
    },
    { timestamps: true }
);

// 🌍 GEO INDEX (STEP 4.1 CORE)
driverSchema.index({ location: "2dsphere" });

// ⚡ COMPOUND INDEX (OPTIMIZATION FOR GEO DISPATCH)
driverSchema.index({ isAvailable: 1, location: "2dsphere" });

export default mongoose.model("Driver", driverSchema);