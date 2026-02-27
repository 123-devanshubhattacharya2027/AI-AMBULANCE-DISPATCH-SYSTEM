import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";  // ✅ import route

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// ✅ MongoDB Connection
mongoose.connect("mongodb://localhost:27017/ambulanceDB")
    .then(() => console.log("MongoDB Connected ✅"))
    .catch((err) => console.log("MongoDB Error ❌", err));

// ✅ Add Auth Routes HERE (important position)
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("AI Ambulance Backend Running 🚑");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});