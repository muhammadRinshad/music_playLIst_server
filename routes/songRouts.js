import express from"express"
import { getSongs, uploadSong } from "../controllers/songController.js"
import upload from "../middlewares/multer.js"
import { middleWareAuthentication } from "../middlewares/authentication.js"
const songRoutes = express.Router()
songRoutes.post('/uploadSong',middleWareAuthentication,upload.single("song"),uploadSong)
songRoutes.get('/getSongs/:userId',middleWareAuthentication,getSongs)
export default songRoutes