import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");

const MAX_SONG_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_COVER_SIZE = 5 * 1024 * 1024;  // 5 MB

const ALLOWED_MP3_MIMES = ["audio/mpeg", "audio/mp3", "audio/x-mpeg-3"];
const ALLOWED_IMG_MIMES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMG_EXT = [".jpg", ".jpeg", ".png", ".webp"];

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  if (file.fieldname === "song") {
    if (ext !== ".mp3") return cb(new Error("Song must have .mp3 extension"), false);
    if (!ALLOWED_MP3_MIMES.includes(mime)) return cb(new Error("Song must be audio/mpeg (MP3)"), false);
  } else if (file.fieldname === "cover") {
    if (!ALLOWED_IMG_EXT.includes(ext)) return cb(new Error("Cover must be .jpg, .png or .webp"), false);
    if (!ALLOWED_IMG_MIMES.includes(mime)) return cb(new Error("Cover must be a valid image"), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });
const uploadWithCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SONG_SIZE }
}).fields([
  { name: "song", maxCount: 1 },
  { name: "cover", maxCount: 1 }
]);

export const validateUploadSize = (req, res, next) => {
  const songFile = req.files?.song?.[0];
  const coverFile = req.files?.cover?.[0];
  if (songFile && songFile.size > MAX_SONG_SIZE) {
    fs.unlinkSync(songFile.path);
    if (coverFile) fs.unlinkSync(coverFile.path);
    return res.status(400).json({ message: `Song file too large. Max ${MAX_SONG_SIZE / 1024 / 1024} MB` });
  }
  if (coverFile && coverFile.size > MAX_COVER_SIZE) {
    if (songFile) fs.unlinkSync(songFile.path);
    fs.unlinkSync(coverFile.path);
    return res.status(400).json({ message: `Cover image too large. Max ${MAX_COVER_SIZE / 1024 / 1024} MB` });
  }
  next();
};

export { uploadWithCover, MAX_SONG_SIZE, MAX_COVER_SIZE };
export default upload;
