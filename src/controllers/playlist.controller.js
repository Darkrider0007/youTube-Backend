import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
  try {
      const { name, description } = req.body;
      if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
      }

      const existedPlaylist = await Playlist.findOne({
        name,
        owner: req.user._id,
      });

      if (existedPlaylist) {
        throw new ApiError(400, "Playlist with this name already exists");
      }

      const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
      });

      res.status(201).json(new ApiResponse(201, { playlist }, "Playlist created"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }

})

const getUserPlaylists = asyncHandler(async (req, res) => {
 try {
       const {userId} = req.params
       //TODO: get user playlists
   
       if (!userId) {
           throw new ApiError(400, "Invalid user id")
       }
       const playlists = await Playlist.aggregate([
           {
               $match:{
                   owner: new mongoose.Types.ObjectId(userId)
               }
           },
           {
               $project:{
                   name: 1,
                   description: 1,
                   videoCount: {
                       $size: "$videos"
                   },
                   createdAt: 1,
                   updatedAt: 1
               }
           }
       ])
   
       res.status(200).json(new ApiResponse(200, {playlists}, "User playlists"))
 } catch (error) {
    throw new ApiError(500, error.message)
 }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!playlistId) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    res.status(200).json(new ApiResponse(200, {playlist}, "Playlist found"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
   try {
     const {playlistId, videoId} = req.params
 
     if (!playlistId || !videoId) {
         throw new ApiError(400, "Invalid playlist id or video id")
     }
 
     const playlist = await Playlist.findById(playlistId)
 
     if (!playlist) {
         throw new ApiError(404, "Playlist not found")
     }
 
     if(playlist.owner.toString() !== req.user._id.toString()){
         throw new ApiError(403, "Unauthorized to perform this action")
     }
 
     if(playlist.videos.includes(videoId)){
         throw new ApiError(400, "Video already exists in playlist")
     }
 
     playlist.videos.push(videoId)
 
     const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
 
     res.status(200).json(new ApiResponse(200, {updatedPlaylist}, "Video added to playlist"))
   } catch (error) {
        throw new ApiError(500, error.message)
   }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId, videoId} = req.params
        // TODO: remove video from playlist
        if (!playlistId || !videoId) {
            throw new ApiError(400, "Invalid playlist id or video id")
        }
    
        const playlist = await Playlist.findById(playlistId)
    
        if (!playlist) {
            throw new ApiError(404, "Playlist not found")
        }
    
        if(playlist.owner.toString() !== req.user._id.toString()){
            throw new ApiError(403, "Unauthorized to perform this action")
        }
    
        if(!playlist.videos.includes(videoId)){
            throw new ApiError(400, "Video does not exists in playlist")
        }
    
        playlist.videos = playlist.videos.filter(id => id.toString() !== videoId.toString())
    
        const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
    
        res.status(200).json(new ApiResponse(200, {updatedPlaylist}, "Video removed from playlist"))
    } catch (error) {
        throw new ApiError(500, error.message)
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Unauthorized to perform this action")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

    res.status(200).json(new ApiResponse(200, {deletePlaylist}, "Playlist deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
   try {
     const {playlistId} = req.params
     const {name, description} = req.body
     //TODO: update playlist
     if (!playlistId) {
         throw new ApiError(400, "Invalid playlist id")
     }
 
     if (!name && !description) {
         throw new ApiError(400, "Name or description is required")
     }
 
     const playlist = await Playlist.findById(playlistId)
 
     if (!playlist) {
         throw new ApiError(404, "Playlist not found")
     }
 
     if(playlist.owner.toString() !== req.user._id.toString()){
         throw new ApiError(403, "Unauthorized to perform this action")
     }
 
     if(playlist.name === name){
         throw new ApiError(400, "Name is same as previous")
     }
 
     if(playlist.description === description){
         throw new ApiError(400, "Description is same as previous")
     }
 
     if(name){
         playlist.name = name
     }
 
     if(description){
         playlist.description = description
     }
 
     const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
 
     res.status(200).json(new ApiResponse(200, {updatedPlaylist}, "Playlist updated"))
   } catch (error) {
    throw new ApiError(500, error.message)
   }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}