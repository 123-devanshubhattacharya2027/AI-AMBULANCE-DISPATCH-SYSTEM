import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // max requests per IP
    message: {
        success: false,
        message: "Too many requests, try again later"
    }
});