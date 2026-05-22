import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import asyncHandler from "express-async-handler";

// ===============================
// Register Schema
// ===============================
const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),

  // 🔥 ONLY USER ALLOWED
  role: z.enum(["USER"]).optional(),
});

// ===============================
// REGISTER CONTROLLER
// ===============================
export const register = asyncHandler(async (req, res) => {

  const validatedData = registerSchema.parse(req.body);

  const {
    name,
    email,
    password,
    role = "USER",
  } = validatedData;

  // 🔥 BLOCK ADMIN & DRIVER REGISTRATION
  if (role === "ADMIN" || role === "DRIVER") {
    return res.status(403).json({
      success: false,
      message: "Registration not allowed for this role",
    });
  }

  // 🔍 CHECK EXISTING USER
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  // 🔐 HASH PASSWORD
  const hashedPassword = await bcrypt.hash(password, 10);

  // 👤 CREATE USER
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: "USER", // 🔥 FORCE USER ROLE
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",

    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// ===============================
// LOGIN CONTROLLER
// ===============================
export const login = asyncHandler(async (req, res) => {

  const { email, password } = req.body;

  console.log("🔐 Login Attempt");
  console.log("Email:", email);

  // 🔍 FIND USER
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // 🔐 PASSWORD CHECK
  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // 🎟️ TOKEN
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRE || "1d",
    }
  );

  // ✅ RESPONSE
  res.status(200).json({
    success: true,
    message: "Login successful",

    token,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});