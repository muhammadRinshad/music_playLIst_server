import express from "express";
import { getPlayLists } from "../controllers/playListController.js";
import { addUser, middleWareAuthentication } from "../middlewares/authentication.js";
import { login, getAllUsers, removeUser } from "../controllers/userController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const userRoutes = express.Router();
userRoutes.post("/addUser", addUser);
userRoutes.post("/login", login);
userRoutes.get("/getPlayLists/:userId", middleWareAuthentication, getPlayLists);
userRoutes.get("/getAllUsers", middleWareAuthentication, requireAdmin, getAllUsers);
userRoutes.delete("/removeUser/:userId", middleWareAuthentication, requireAdmin, removeUser);

export default userRoutes;