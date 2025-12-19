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
app.use("/",userRoutes)
app.use("/song",songRoutes)
app.use("/playList",playListRoutes)

connectDB()
app.listen(3000,()=>console.log("server running at local host:3000"))
