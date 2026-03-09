import express from "express";
import { getSongs, uploadSong, getAllSongs, toggleLike, getLikedSongs, recordPlay, getSongsBySection, getSongById, deleteSong } from "../controllers/songController.js";
import { uploadWithCover, validateUploadSize } from "../middlewares/multer.js";
import { middleWareAuthentication } from "../middlewares/authentication.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { uploadLimiter, likePlayLimiter } from "../middlewares/rateLimit.js";

const songRoutes = express.Router();
songRoutes.post("/uploadSong", uploadLimiter, middleWareAuthentication, requireAdmin, uploadWithCover, validateUploadSize, uploadSong);
songRoutes.get("/getSongs/:userId", middleWareAuthentication, getSongs);
songRoutes.get("/getSong/:songId", middleWareAuthentication, getSongById);
songRoutes.get("/getAllSongs", middleWareAuthentication, requireAdmin, getAllSongs);
songRoutes.post("/toggleLike/:songId", likePlayLimiter, middleWareAuthentication, toggleLike);
songRoutes.get("/getLikedSongs", middleWareAuthentication, getLikedSongs);
songRoutes.post("/recordPlay/:songId", likePlayLimiter, middleWareAuthentication, recordPlay);
songRoutes.get("/getSongsBySection/:userId", middleWareAuthentication, getSongsBySection);
songRoutes.delete("/deleteSong/:songId", middleWareAuthentication, requireAdmin, deleteSong);
songRoutes.post("/deleteSong/:songId", middleWareAuthentication, requireAdmin, deleteSong);
export default songRoutes;