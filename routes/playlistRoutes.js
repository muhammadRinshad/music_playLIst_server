import express from "express"
import { addToPlayList, createPlayList, getSongsOnPlayList, removeFromPlayList, removePlayList } from "../controllers/playListController.js"
import { middleWareAuthentication } from "../middlewares/authentication.js"
const playListRoutes= express.Router()
playListRoutes.post("/createPlayList/:owner",middleWareAuthentication,createPlayList)
playListRoutes.put("/addToPlayList/:playList",middleWareAuthentication,addToPlayList)
playListRoutes.put("/removeFromPlayList/:playList",middleWareAuthentication,removeFromPlayList)
playListRoutes.delete("/removePlayList/:PlayList",middleWareAuthentication,removePlayList)
playListRoutes.get("/getSongsOnPlayList/:PlayList",middleWareAuthentication,getSongsOnPlayList)


export default playListRoutes