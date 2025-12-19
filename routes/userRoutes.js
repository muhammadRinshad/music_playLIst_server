import express from"express"
import { getPlayLists } from "../controllers/playListController.js"
import { addUser, middleWareAuthentication } from "../middlewares/authentication.js"
import { login } from "../controllers/userController.js"
const userRoutes = express.Router()
userRoutes.post('/addUser',addUser)
userRoutes.get('/getPlayLists/:userId',middleWareAuthentication,getPlayLists)
userRoutes.post("/login", login);

export default userRoutes