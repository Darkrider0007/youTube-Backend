import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params
        //TODO: toggle like on video
        const userId = req.user._id

        if(!videoId || !userId) {
            throw new ApiError(400, "Invalid request")
        }

        const like = await Like.findOne({video: videoId, likedBy: userId})

        if(!like){
            const newLike = await Like.create({video: videoId, likedBy: userId})
            if(!newLike){
                throw new ApiError(500, "Failed to like video")
            }

            res.
            status(201)
            .json(new ApiResponse(201, "Video liked", newLike))
        }
        else{
            const deletedLike = await Like.findByIdAndDelete(like._id)
            if(!deletedLike){
                throw new ApiError(500, "Failed to unlike video")
            }
            res
            .status(200)
            .json(new ApiResponse(200, "Video like removed", deletedLike))
        }
    } catch (error) {
        throw new ApiError(500, error.message)
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    try {
        const userId = req.user._id
    
        if(!userId) {
            throw new ApiError(400, "Invalid request")
        }
    
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(userId),
                    video: {$exists: true}
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video"
                }
            },
            {
                $unwind: "$video"
            },
            {
                $project: {
                    _id: 1,
                    likedBy: 1,
                    video: {
                        _id: 1,
                        title: 1,
                        thumbnail: 1,
                        views: 1,
                        duration: 1,
                        isPublished: 1,                
                    }        
                }
            }
        ])

        if(!likedVideos){
            throw new ApiError(404, "No liked videos found")
        }
    
        res
        .status(200)
        .json(new ApiResponse(200, "Liked videos", likedVideos))
    } catch (error) {
        throw new ApiError(500, error.message)
    }
})

const getLikedComments = asyncHandler(async (req, res) => {
})

const getLikedTweets = asyncHandler(async (req, res) => {
})

const countVideoLikes = asyncHandler(async (req, res) => {
})

const countCommentLikes = asyncHandler(async (req, res) => {
})

const countTweetLikes = asyncHandler(async (req, res) => {
})



export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedComments,
    getLikedTweets,
    countVideoLikes,
    countCommentLikes,
    countTweetLikes

}