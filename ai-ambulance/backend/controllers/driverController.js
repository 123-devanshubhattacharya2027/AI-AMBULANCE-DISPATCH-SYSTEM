import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createDriver = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Driver already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const driver = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "DRIVER"
        });

        res.status(201).json({
            success: true,
            message: "Driver created successfully 🚑",
            driver
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};