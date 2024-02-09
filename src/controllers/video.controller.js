import mongoose, {isValidObjectId} from "mongoose"
import Video from "../models/video.model.js"
import User from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  try {
    // get all videos based on query, sort, pagination
    // run a query -
    // we also check for query i.e. through which we can search from search bar
    // also important take care of not showing videos with isPublic = false
    // first check for page and limit
    // sortBy - createdAt , views , duration
    // sortType - ascending , descending
    // sort by UserId i.e get all the videos of user
  
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  
    const pageOptions = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };
  
    let pipelineArray = [
      {
        $match: {
          isPublished: true,
        },
      },
    ];
  
    if (query) {
      pipelineArray.push({
        $match: {
          title: {
            $regex: query,
            $options: "i",
          },
        },
      });
    }
  
    if (sortBy) {
      pipelineArray.push({
        $sort: {
          [sortBy]: sortType == "ascending" ? 1 : -1,
        },
      });
    }
  
    if (userId) {
      if (!isValidObjectId(userId)) throw new ApiError(400, "invalid userId");
      pipelineArray.push({
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      });
    }
  
    pipelineArray.push({
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "channel",
      },
    });
  
    pipelineArray.push({
      $unwind: "$channel",
    });
  
    pipelineArray.push({
      $project: {
        _id: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        channel: "$channel.username",
        channelFullName: "$channel.fullName",
        channelAvatar: "$channel.avatar",
      },
    });
  
    const videos = await Video.aggregate(pipelineArray)
      .limit(pageOptions.limit);
  
    return res.status(200).json(new ApiResponse(200, videos, "videos found"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if(!req.files.videoFile || !req.files.thumbnail){
        if(req.files.videoFile){
            fs.unlinkSync(req.files?.videoFile[0]?.path)
        }
        if(req.files.thumbnail){
            fs.unlinkSync(req.files?.thumbnail[0]?.path)
        }
        throw new ApiError(401,"either videoFile or thumbnail is missing");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!title || !description){
        if(videoFileLocalPath){
            fs.unlinkSync(videoFileLocalPath)
        }
        if(thumbnailLocalPath){
            fs.unlinkSync(thumbnailLocalPath)
        }
        throw new ApiError(401,"cannot publish video without title and description");
    }

    const ownerId = req.user?._id ;
    if(!ownerId) throw new ApiError(401,"user not loggedin");

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail || !videoFile){ 
        throw new ApiError(500,"uploading error when uploading either video or thumbnail to cloudinary") ;
    }

    const video = await Video.create({
        videoFile:videoFile.secure_url ,
        thumbnail:thumbnail.secure_url ,
        owner:ownerId,
        title,
        description,
        duration:videoFile.duration ,
        isPublic:req.body.isPublic == "false" ? false : true
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,video,"video is published")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(404,"video not found");
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video found")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path;
    const oldThumbnail = req.video?.thumbnail;
    console.log(oldThumbnail);

    if(!title || !description){
        if(thumbnailLocalPath){
            fs.unlinkSync(thumbnailLocalPath)
        }
        throw new ApiError(401,"cannot update video details without title and description");
    }


    const video = await Video.findByIdAndUpdate(videoId,{
        title,
        description,
        thumbnail:thumbnailLocalPath ? (await uploadOnCloudinary(thumbnailLocalPath)).secure_url : oldThumbnail
    },{new:true})

    if(!video) throw new ApiError(404,"video not found");

    await deleteFromCloudinary(oldThumbnail);

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video details is updated")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const videoUrl = req.video?.videoFile;
    const thumbnailUrl = req.video?.thumbnail;
    if(!videoUrl || !thumbnailUrl) throw new ApiError(404,"video not found");
    const video = await Video.findByIdAndDelete(videoId);
    if(!video) throw new ApiError(404,"video not found");
    await deleteFromCloudinary(videoUrl);
    await deleteFromCloudinary(thumbnailUrl);
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video is deleted")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findByIdAndUpdate(videoId,{
        isPublished:!req.video?.isPublished
    },{new:true}).select("isPublished");
    if(!video) throw new ApiError(404,"video not found");
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video publish status is updated")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}