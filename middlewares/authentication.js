import User from "../models/userModel.js"
import bcrypt from "bcryptjs"
export async function addUser(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }
    const usernameLower = username.trim().toLowerCase();
    if (usernameLower.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }
    if (usernameLower.length > 20) {
      return res.status(400).json({ message: "Username must be at most 20 characters" });
    }
    if (!/^[a-z0-9_]+$/.test(usernameLower)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
    }

    const existingUsername = await User.findOne({ username: usernameLower });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const emailNorm = (email || "").trim().toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({ message: "Email is required" });
    }
    const existingEmail = await User.findOne({ email: emailNorm });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (!password || password.length <= 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: usernameLower,
      email: emailNorm,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id
    });
  } catch (error) {
    console.error("addUser error:", error);
    if (error.code === 11000) {
      const field = error.keyPattern?.username ? "Username" : "Email";
      return res.status(400).json({ message: `${field} already exists` });
    }
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors)[0]?.message || "Validation failed";
      return res.status(400).json({ message: msg });
    }
    return res.status(400).json({
      message: error.message || "Error occurred when registering user"
    });
  }
}

import jwt from "jsonwebtoken";

export const middleWareAuthentication = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed" });
  }
};
