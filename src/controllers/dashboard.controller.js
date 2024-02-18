import mongoose from "mongoose"
import Video from "../models/video.model.js"
import Subscription from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400, "User not found")
    }

    const totalVideos = await Video.countDocuments({user: userId})
    

    const totalVideosViews = await Video.aggregate([
        {
            $match: {user: new mongoose.Types.ObjectId(userId)}
        },
        {
            $group: {
                _id: null,
                totalViews: {$sum: "$views"}
            }
        }
    ])
  
    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {$sum: 1}
            }
        }
    ])

    const totalLikes = await Like.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {$sum: 1}
            }
        }
    ])


    const stats = {
        totalVideos: totalVideos,
        totalVideosViews: totalVideosViews[0].totalViews,
        totalSubscribers: totalSubscribers[0].totalSubscribers,
        totalLikes: totalLikes[0].totalLikes
    }   

    res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400, "User not found")
    }

    const videos = await Video.aggregate([
        {
            $match: {user: new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                thumbnail: 1,
                "user._id": 1,
                "user.username": 1
            }
        }
    ])
    
    res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
}