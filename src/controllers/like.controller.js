import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
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