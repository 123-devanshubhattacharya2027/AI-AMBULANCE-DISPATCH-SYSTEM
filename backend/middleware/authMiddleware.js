import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

export const protect = async (req, res, next) => {
    try {
        let token;

        // 🔍 Debug header (production-safe logging)
        logger.info(`Auth Header: ${req.headers.authorization}`);

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token missing"
            });
        }

        // 🔐 Verify token using ENV secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;

        next();

    } catch (err) {
        logger.error(`Auth Error: ${err.message}`);

        return res.status(401).json({
            success: false,
            message: "Token invalid"
        });
    }
};