// ==========================================
// ✅ VALIDATE DRIVER LOCATION INPUT
// ==========================================

export const validateLocation = (req, res, next) => {
    try {
        const { coordinates } = req.body;

        // 1️⃣ Check if coordinates exist
        if (!coordinates) {
            return res.status(400).json({
                success: false,
                message: "Coordinates are required",
            });
        }

        // 2️⃣ Check if it's an array of length 2
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            return res.status(400).json({
                success: false,
                message: "Coordinates must be an array [longitude, latitude]",
            });
        }

        let [lng, lat] = coordinates;

        // 3️⃣ Convert to numbers
        lng = Number(lng);
        lat = Number(lat);

        // 4️⃣ Check valid numbers
        if (isNaN(lng) || isNaN(lat)) {
            return res.status(400).json({
                success: false,
                message: "Coordinates must be valid numbers",
            });
        }

        // 5️⃣ Check valid ranges
        if (lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: "Longitude must be between -180 and 180",
            });
        }

        if (lat < -90 || lat > 90) {
            return res.status(400).json({
                success: false,
                message: "Latitude must be between -90 and 90",
            });
        }

        // 6️⃣ Normalize values (important for DB consistency)
        req.body.coordinates = [lng, lat];

        // 7️⃣ Pass to next middleware/controller
        next();

    } catch (error) {
        console.error("Validation Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error during validation",
        });
    }
};