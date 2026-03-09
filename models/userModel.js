import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    likedSongs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song"
    }]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
