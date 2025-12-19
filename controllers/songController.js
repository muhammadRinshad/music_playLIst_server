import Song from "../models/songModel.js";
import cloudinary from "../config/cloudnary.js";
import fs from "fs";
import User from "../models/userModel.js";
import songModel from "../models/songModel.js";

export const uploadSong = async (req, res, next) => {
  try {
    console.log("REQ.BODY:", req.body);
    console.log("REQ.FILE:", req.file);
    if (!req.file)
      return res.status(400).json({ message: "MP3 file required" });
    const { title, artist ,uploadedBy} = req.body;
    console.log("req.filepath.......:",req.file.path);
    
    const uploadedSong = await cloudinary.uploader.upload(
      req.file.path,
      {
        resource_type:  "video",
        folder: "songs"
      }
    );
    console.log("CLOUDINARY RESPONSE:", uploadedSong.secure_url);

    fs.unlinkSync(req.file.path);
    const newSong = await Song.create({
      title,
      artist,
      filePath: uploadedSong.secure_url,
      uploadedBy
    });

    res.status(201).json(newSong);
    console.log("song added");
    

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getSongs = async (req, res) =>{
     try {
      const{userId}=req.params
      console.log("REQ.PARAMS:",req.params);
      const user=await User.findById(userId)
      console.log("user:",user);
      if (!user) {
        console.log("user not available");
        res.status(400).send("user not available")
      }
      const userSongs=await songModel.find({uploadedBy:userId})
      console.log("userSong:",userSongs);
      res.status(200).send(userSongs)
      
     } catch (error) {
      console.log(error);
      
     }
}
