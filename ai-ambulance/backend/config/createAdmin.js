import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

mongoose.connect("mongodb://localhost:27017/ambulanceDB")
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

const createAdmin = async () => {
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });

    if (existingAdmin) {
        console.log("Admin already exists");
        process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
        name: "Super Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "ADMIN"
    });

    console.log("Admin Created Successfully ✅");
    process.exit();
};

createAdmin();