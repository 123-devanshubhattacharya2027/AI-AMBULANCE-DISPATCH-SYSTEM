import EmergencyRequest from "../models/EmergencyRequest.js";

// ==========================================
// ✅ GET ALL REQUESTS (Admin)
// ==========================================
export const getAllRequests = async (req, res) => {
    try {
        const {
            status,
            emergencyType,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        // 🔹 Safe Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;

        // 🔹 Filter
        const filter = {};
        if (status) filter.status = status;
        if (emergencyType) filter.emergencyType = emergencyType;

        // 🔹 Sorting
        const sortOrder = order === "asc" ? 1 : -1;

        const [requests, total] = await Promise.all([
            EmergencyRequest.find(filter)
                // ✅ Select only required fields
                .select("status emergencyType createdAt user assignedDriver")

                // ✅ Optimized population
                .populate("user", "name email")
                .populate({
                    path: "assignedDriver",
                    select: "user",
                    populate: {
                        path: "user",
                        select: "name email"
                    }
                })

                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limitNum)
                .lean(),

            EmergencyRequest.countDocuments(filter),
        ]);

        res.json({
            success: true,
            count: requests.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
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
// ✅ GET SINGLE REQUEST (Admin)
// ==========================================
export const getRequestById = async (req, res) => {
    try {
        const request = await EmergencyRequest.findById(req.params.id)

            // ✅ Select only required fields
            .select("status emergencyType description location user assignedDriver createdAt")

            // ✅ Optimized population
            .populate("user", "name email phone")
            .populate({
                path: "assignedDriver",
                select: "user",
                populate: {
                    path: "user",
                    select: "name email phone"
                }
            })

            .lean();

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        res.json({
            success: true,
            data: request,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};