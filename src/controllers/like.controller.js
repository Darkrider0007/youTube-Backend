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
            .json(new ApiResponse(201, newLike, "Video liked",))
        }
        else{
            const deletedLike = await Like.findByIdAndDelete(like._id)
            if(!deletedLike){
                throw new ApiError(500, "Failed to unlike video")
            }
            res
            .status(200)
            .json(new ApiResponse(200, deletedLike, "Video like removed",))
        }
    } catch (error) {
        throw new ApiError(500, error.message)
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400, "Invalid request")
    }
    const userId = req.user._id

    if(!userId){
        throw new ApiError(400, "Invalid request")
    }

    const like = await Like.findOne({comment: commentId, likedBy: userId})

    if(!like){
        const newLike = await Like.create({comment: commentId, likedBy: userId})
        if(!newLike){
            throw new ApiError(500, "Failed to like comment")
        }

        res.
        status(201)
        .json(new ApiResponse(201, newLike, "Comment liked"))
    }
    else{
        const deletedLike = await Like.findByIdAndDelete(like._id)
        if(!deletedLike){
            throw new ApiError(500, "Failed to unlike comment")
        }
        res
        .status(200)
        .json(new ApiResponse(200, deletedLike, "Comment like removed"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400, "Invalid request")
    }

    const userId = req.user._id
    if(!userId){
        throw new ApiError(400, "Invalid request")
    }

    const like = await Like.findOne({tweet: tweetId, likedBy: userId})

    if(!like){
        const newLike = await Like.create({tweet: tweetId, likedBy: userId})
        if(!newLike){
            throw new ApiError(500, "Failed to like tweet")
        }

        res.
        status(201)
        .json(new ApiResponse(201, newLike, "Tweet liked"))
    }
    else{
        const deletedLike = await Like.findByIdAndDelete(like._id)
        if(!deletedLike){
            throw new ApiError(500, "Failed to unlike tweet")
        }
        res
        .status(200)
        .json(new ApiResponse(200, deletedLike, "Tweet like removed"))
    }
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
        .json(new ApiResponse(200, likedVideos, "Liked videos"))
    } catch (error) {
        throw new ApiError(500, error.message)
    }
})

const getLikedComments = asyncHandler(async (req, res) => {
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400, "Invalid request")
    }

    const likedComments = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                comment: {$exists: true}
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "comment"
            }
        },
        {
            $unwind: "$comment"
        },
        {
            $project: {
                _id: 1,
                likedBy: 1,
                comment: {
                    _id: 1,
                    content: 1,
                    owner: 1,
                }
            }
        }
    ])

    if(!likedComments){
        throw new ApiError(404, "No liked comments found")
    }

    res
    .status(200)
    .json(new ApiResponse(200,likedComments, "Liked comments", ))
})

const getLikedTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400, "Invalid request")
    }

    const likedTweets = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                tweet: {$exists: true}
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweet"
            }
        },
        {
            $unwind: "$tweet"
        },
        {
            $project: {
                _id: 1,
                likedBy: 1,
                tweet: {
                    _id: 1,
                    text: 1,
                    owner: 1,
                }
            }
        }
    ])

    if(!likedTweets){
        throw new ApiError(404, "No liked tweets found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, likedTweets, "Liked tweets"))
})

const countVideoLikes = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400, "Invalid request")
    }

    const count = await Like.countDocuments({video: videoId})

    if(!count){
        throw new ApiError(404, "No likes found for video")
    }

    res
    .status(200)
    .json(new ApiResponse(200, count, "Video Likes count"))
})

const countCommentLikes = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400, "Invalid request")
    }

    const count = await Like.countDocuments({comment: commentId})

    if(!count){
        throw new ApiError(404, "No likes found for comment")
    }

    res
    .status(200)
    .json(new ApiResponse(200, count, "Comments Likes count"))
})

const countTweetLikes = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400, "Invalid request")
    }

    const count = await Like.countDocuments({tweet: tweetId})

    if(!count){
        throw new ApiError(404, "No likes found for tweet")
    }

    res
    .status(200)
    .json(new ApiResponse(200, count, "Tweet Likes count"))
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