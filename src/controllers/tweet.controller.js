import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import User from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const userId = req.user?._id

    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    if(!tweet){
        throw new ApiError(500, "Tweet not created")
    }

    res
    .status(201)
    .json(new ApiResponse(201, {tweet}, "Tweet created successfully"))


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)            
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project:{
                _id: 1,
                content: 1,
                createdAt: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])


    res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    if(content.toString()==req.tweet.content.toString()){
        throw new ApiError(400, "Content is the same")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        content
    }, {new: true})

    if(!updatedTweet){
        throw new ApiError(500, "Tweet not updated")
    }

    res
    .status(200)
    .json(new ApiResponse(200, {updatedTweet}, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
        throw new ApiError(500, "Tweet not deleted")
    }

    res
    .status(200)
    .json(new ApiResponse(200, {deletedTweet}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}