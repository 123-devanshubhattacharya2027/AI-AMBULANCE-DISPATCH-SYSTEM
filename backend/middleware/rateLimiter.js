import rateLimit from "express-rate-limit";

// 🔹 General API limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
});

// 🔹 Auth limiter (STRICT)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // stricter for login/register
    message: {
        success: false,
        message: "Too many auth attempts, please try again later.",
    },
});