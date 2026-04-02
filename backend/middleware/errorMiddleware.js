import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
    // 🔥 Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // ===============================
    // 🔐 Handle MongoDB Errors
    // ===============================
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = "Duplicate field value entered";
    }

    // ===============================
    // 🔐 Handle JWT Errors
    // ===============================
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }

    // ===============================
    // 🔐 Handle Zod Validation Errors
    // ===============================
    if (err.name === "ZodError") {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(", ");
    }

    // ===============================
    // 📊 Logging
    // ===============================
    logger.error({
        message: err.message,
        stack: err.stack,
        statusCode
    });

    // ===============================
    // 📤 Response
    // ===============================
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

