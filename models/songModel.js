import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    filePath: { type: String, required: true },
    coverUrl: { type: String },
    duration: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likeCount: { type: Number, default: 0 },
    playCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

songSchema.index({ likeCount: -1 });
songSchema.index({ playCount: -1 });
songSchema.index({ createdAt: -1 });

export default mongoose.model("Song", songSchema);
