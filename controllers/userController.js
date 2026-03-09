import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import playListModel from "../models/playListModel.js";

export const login = async (req, res) => {
  try {
    const emailOrUsername = req.body.emailOrUsername || req.body.email;
    const password = req.body.password;
    const input = (emailOrUsername || "").trim().toLowerCase();

    if (!input || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: input }, { username: input }]
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = String(req.user._id);

    if (userId === adminId) {
      return res.status(400).json({ message: "Cannot remove yourself" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await playListModel.deleteMany({ owner: userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
