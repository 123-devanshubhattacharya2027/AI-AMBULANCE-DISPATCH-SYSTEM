import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { notFound, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

/* -------------------- Security + Parsers -------------------- */
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------- CORS -------------------- */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

/* -------------------- Logs -------------------- */
app.use(morgan("dev"));

/* -------------------- Rate Limiter -------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  message: "Too many requests. Please try again later.",
});
app.use("/api", limiter);

/* -------------------- Health Check -------------------- */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Ambulance Dispatch Backend Running ✅",
    time: new Date().toISOString(),
  });
});

/* -------------------- Root -------------------- */
app.get("/", (req, res) => {
  res.send("Ambulance Dispatch API ✅");
});

/* -------------------- Error Handler -------------------- */
app.use(notFound);
app.use(errorHandler);

export default app;

