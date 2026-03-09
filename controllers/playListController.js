import playListModel from "../models/playListModel.js";
import songModel from "../models/songModel.js";
import User from "../models/userModel.js";

export async function createPlayList(req,res) {
    try {
        const{title}=req.body
        const{owner}=req.params
        const newPlayList=await playListModel.create({
            title,
            owner
        })
        console.log("playList created successfully");
        res.status(201).send({msg:"playList created successfully",value:newPlayList})
        
    } catch (error) {
        console.log(error);
        
    }


    
}
export async function addToPlayList(req, res) {
  try {
    const { song } = req.body;
    const { playList } = req.params;

    const currentPlayList = await playListModel.findById(playList);

    if (!currentPlayList) {
      res.status(404).json({ message: "Playlist not found" });

      console.log("Playlist not found");
      return
    }

    const newSong = await songModel.findById(song);
    if (!newSong) {
      res.status(404).json({ message: "Song not found" });
      console.log("Song not found");
      return
    }
    if (!Array.isArray(currentPlayList.songs)) {
      currentPlayList.songs = [];
    }

    if (currentPlayList.songs.includes(song)) {
      res.status(400).json({ message: "Song already in playlist" });
      console.log("Song already in playlist");
      return
      
    }
    currentPlayList.songs.push(song);
    await currentPlayList.save();

    res.status(200).json({
      message: "Song added to playlist",
      playlist: currentPlayList,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
export async function removeFromPlayList(req, res) {
  try {
    const { song } = req.body;
    const { playList } = req.params;

    const currentPlayList = await playListModel.findById(playList);

    if (!currentPlayList) {
      res.status(404).json({ message: "Playlist not found" });

      console.log("Playlist not found");
      return
    }

    const newSong = await songModel.findById(song);
    if (!newSong) {
      res.status(404).json({ message: "Song not found" });
      console.log("Song not found");
      return
    }

    if (currentPlayList.songs.includes(song)) {
      
      
    
    currentPlayList.songs.pull(song);
    await currentPlayList.save();
    }
    res.status(200).json({
      message: "Song removed from playlist",
      playlist: currentPlayList,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
export async function removePlayList(req,res) {
    try {
        const{playList}=req.params
        await playListModel.findOneAndDelete(playList)
        console.log("playList removed successfully");
        res.status(201).send("playList removed successfully")
        
    } catch (error) {
        console.log(error);
        
    }


    
}
export async function getSongsOnPlayList(req,res) {
    try {
      console.log("playList controller working");
      
        const{PlayList}=req.params
        console.log("REQ.PARAMS",req.params);
        const onlyPlayList=await playListModel.findById(PlayList)
        console.log("onlyPlayList:",onlyPlayList);
        
        const currentPlayList=await playListModel.findById(PlayList).populate("songs")
        console.log("current playlist:",currentPlayList);
        res.status(200).send(currentPlayList)
        
    } catch (error) {
        console.log(error);
        
    } 
}
export const reorderPlaylist = async (req, res) => {
  try {
    const { playList } = req.params;
    const { songIds } = req.body;

    if (!Array.isArray(songIds)) {
      return res.status(400).json({ message: "songIds array required" });
    }

    const playlist = await playListModel.findById(playList);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    playlist.songs = songIds.filter((id) =>
      playlist.songs.some((s) => String(s) === String(id))
    );
    await playlist.save();

    const updated = await playListModel.findById(playList).populate("songs");
    res.json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPlayLists = async (req, res) =>{
     try {
      const{userId}=req.params
      console.log("REQ.PARAMS:",req.params);
      const user=await User.findById(userId)
      console.log("user:",user);
      if (!user) {
        console.log("user not available");
        res.status(400).send("user not available")
      }
      const userPlayLists=await playListModel.find({owner:userId})
      console.log("userPlaysts:",userPlayLists);
      res.status(200).send(userPlayLists)
      
     } catch (error) {
      console.log(error);
      
     }
}
