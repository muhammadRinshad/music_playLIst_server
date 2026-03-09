import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/dbConfig.js'
import userRoutes from './routes/userRoutes.js'
import songRoutes from './routes/songRouts.js'
import playListRoutes from './routes/playlistRoutes.js'
import cors from "cors"
dotenv.config()
const app =express()
app.use(cors())
app.use(express.json())
app.use("/song", songRoutes)
app.use("/playList", playListRoutes)
app.use("/", userRoutes)

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Song max 25 MB, cover max 5 MB." });
  }
  if (err.message?.includes("Song must") || err.message?.includes("Cover must")) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

connectDB()
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))
