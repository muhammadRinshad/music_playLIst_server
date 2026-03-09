import Song from "../models/songModel.js";
import cloudinary from "../config/cloudnary.js";
import fs from "fs";
import User from "../models/userModel.js";
import songModel from "../models/songModel.js";
import playListModel from "../models/playListModel.js";
import { parseFile } from "music-metadata";

function getPublicIdFromUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const afterUpload = url.split("/upload/")[1];
  if (!afterUpload) return null;
  const withoutQuery = afterUpload.split("?")[0];
  const match = withoutQuery.match(/v\d+\/(.+)\.[a-z0-9]+$/i);
  if (match) return match[1];
  const fallback = withoutQuery.replace(/\.[a-z0-9]+$/i, "").replace(/^[^/]*\//, "");
  return fallback || null;
}

export const uploadSong = async (req, res, next) => {
  try {
    const songFile = req.files?.song?.[0] || req.file;
    if (!songFile) return res.status(400).json({ message: "MP3 file required" });

    let title = req.body.title?.trim();
    let artist = req.body.artist?.trim();
    const uploadedBy = req.body.uploadedBy;
    let duration = 0;

    try {
      const metadata = await parseFile(songFile.path);
      duration = metadata.format.duration ? Math.round(metadata.format.duration) : 0;
      if (!title && metadata.common.title) title = metadata.common.title;
      if (!artist && metadata.common.artist) artist = metadata.common.artist;
    } catch (e) {
      console.log("Metadata parse optional:", e.message);
    }

    if (!title) title = "Unknown";
    if (!artist) artist = "Unknown";

    let coverUrl = null;
    if (req.files?.cover?.[0]) {
      const coverFile = req.files.cover[0];
      const uploadedCover = await cloudinary.uploader.upload(coverFile.path, {
        folder: "covers",
        transformation: [{ width: 500, height: 500, crop: "fill" }]
      });
      coverUrl = uploadedCover.secure_url;
      fs.unlinkSync(coverFile.path);
    }

    const uploadedSong = await cloudinary.uploader.upload(
      songFile.path,
      { resource_type: "video", folder: "songs" }
    );

    fs.unlinkSync(songFile.path);
    const newSong = await Song.create({
      title,
      artist,
      filePath: uploadedSong.secure_url,
      coverUrl,
      duration,
      uploadedBy
    });

    res.status(201).json(newSong);
    console.log("song added");
  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getSongs = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(8, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim().toLowerCase();

    const user = await User.findById(userId).select("likedSongs");
    if (!user) {
      return res.status(400).json({ message: "User not available" });
    }

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } }
      ];
    }

    const [songs, total] = await Promise.all([
      songModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("uploadedBy", "username email"),
      songModel.countDocuments(filter)
    ]);

    const likedSet = new Set((user.likedSongs || []).map((id) => String(id)));
    const songsWithLiked = songs.map((s) => ({
      ...s.toObject(),
      isLiked: likedSet.has(String(s._id))
    }));

    res.status(200).json({
      songs: songsWithLiked,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllSongs = async (req, res) => {
  try {
    const songs = await songModel.find({}).sort({ createdAt: -1 }).populate("uploadedBy", "username email");
    res.status(200).json(songs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const song = await songModel.findById(songId);
    if (!song) return res.status(404).json({ message: "Song not found" });

    const likedSongs = user.likedSongs || [];
    const idx = likedSongs.findIndex((id) => String(id) === String(songId));

    if (idx >= 0) {
      likedSongs.splice(idx, 1);
      song.likeCount = Math.max(0, (song.likeCount || 0) - 1);
    } else {
      likedSongs.push(songId);
      song.likeCount = (song.likeCount || 0) + 1;
    }
    user.likedSongs = likedSongs;
    await user.save();
    await song.save();

    res.json({ isLiked: idx < 0, likedSongs: user.likedSongs, likeCount: song.likeCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const recordPlay = async (req, res) => {
  try {
    const { songId } = req.params;
    const song = await songModel.findByIdAndUpdate(
      songId,
      { $inc: { playCount: 1 } },
      { new: true }
    );
    if (!song) return res.status(404).json({ message: "Song not found" });
    res.json({ playCount: song.playCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSongsBySection = async (req, res) => {
  try {
    const { userId } = req.params;
    const section = req.query.section || "mostLiked";
    const limit = Math.min(20, Math.max(6, parseInt(req.query.limit) || 8));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select("likedSongs");
    if (!user) return res.status(400).json({ message: "User not available" });
    const likedSet = new Set((user.likedSongs || []).map((id) => String(id)));

    const addLiked = (songs) =>
      songs.map((s) => {
        const obj = s.toObject ? s.toObject() : s;
        return { ...obj, isLiked: likedSet.has(String(obj._id)) };
      });

    let songs = [];
    let total = 0;

    if (section === "mostLiked") {
      total = await songModel.countDocuments({});
      songs = await songModel.find({}).sort({ likeCount: -1 }).skip(skip).limit(limit).populate("uploadedBy", "username email");
    } else if (section === "mostPlayed") {
      total = await songModel.countDocuments({});
      songs = await songModel.find({}).sort({ playCount: -1 }).skip(skip).limit(limit).populate("uploadedBy", "username email");
    } else if (section === "popular") {
      total = await songModel.countDocuments({});
      const popularDocs = await songModel.aggregate([
        { $addFields: { score: { $add: [{ $ifNull: ["$likeCount", 0] }, { $ifNull: ["$playCount", 0] }] } } },
        { $sort: { score: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: "users", localField: "uploadedBy", foreignField: "_id", as: "uploadedByDoc" } },
        { $unwind: { path: "$uploadedByDoc", preserveNullAndEmptyArrays: true } },
        { $addFields: { uploadedBy: "$uploadedByDoc" } },
        { $project: { uploadedByDoc: 0 } }
      ]);
      songs = popularDocs;
    }

    const hasMore = skip + songs.length < total;

    res.json({
      songs: addLiked(songs),
      hasMore,
      page,
      total
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getSongById = async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user?._id;
    const song = await songModel.findById(songId).populate("uploadedBy", "username email");
    if (!song) return res.status(404).json({ message: "Song not found" });
    const user = userId ? await User.findById(userId).select("likedSongs") : null;
    const likedSet = user ? new Set((user.likedSongs || []).map((id) => String(id))) : new Set();
    const obj = song.toObject();
    res.json({ ...obj, isLiked: likedSet.has(String(obj._id)) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { songId } = req.params;
    const song = await songModel.findById(songId);
    if (!song) return res.status(404).json({ message: "Song not found" });

    const filePublicId = getPublicIdFromUrl(song.filePath);
    if (filePublicId) {
      await cloudinary.uploader
        .destroy(filePublicId, { resource_type: "video", invalidate: true })
        .catch((e) => console.log("Cloudinary song delete:", e.message));
    }

    if (song.coverUrl) {
      const coverPublicId = getPublicIdFromUrl(song.coverUrl);
      if (coverPublicId) {
        await cloudinary.uploader
          .destroy(coverPublicId, { resource_type: "image", invalidate: true })
          .catch((e) => console.log("Cloudinary cover delete:", e.message));
      }
    }

    await User.updateMany({ likedSongs: songId }, { $pull: { likedSongs: songId } });
    await playListModel.updateMany({ songs: songId }, { $pull: { songs: songId } });
    await songModel.findByIdAndDelete(songId);

    res.json({ message: "Song deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getLikedSongs = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("likedSongs");
    const songs = (user.likedSongs || [])
      .filter((s) => s != null)
      .map((s) => ({ ...s.toObject(), isLiked: true }));
    res.status(200).json(songs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
