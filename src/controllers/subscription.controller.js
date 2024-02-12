import mongoose, {isValidObjectId} from "mongoose"
import User from "../models/user.model.js"
import  Subscription  from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const user = req.user;
    if (!user) {
        throw new ApiError(400, "Unauthorized user");
    }

    if (user._id === channelId) {
        throw new ApiError(400, "Channel and User are same. Cannot subscribe to self.");
    }

    let subscription = await Subscription.findOne({
        subscriber: user._id,
        channel: channelId
    });

    if (!subscription) {
        subscription = await Subscription.create({
            subscriber: user._id,
            channel: channelId
        });

        if (!subscription) {
            throw new ApiError(500, "Subscription failed");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, subscription, "Subscription successful"));
    } else {
        subscription = await Subscription.findOneAndDelete({
            subscriber: user._id,
            channel: channelId
        });

        if (!subscription) {
            throw new ApiError(500, "Unsubscription failed");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, subscription, "Unsubscription successful"));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId) throw new ApiError(400,"ChannelID required!")

    if(!isValidObjectId(channelId)) throw new ApiError(400,"Invalid channel id")

    // console.log(channelId, req.user._id)

    if(channelId.toString() !== req.user._id.toString()) throw new ApiError(403,"Unauthorized to perform this action!")

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers"
            }
        },
        {
           $unwind:"$subscribers" 
        },
        {
            $project:{
                _id:0,
                channel: 1,
                subscriber: "$subscribers._id",
                username: "$subscribers.username",
                fullName: "$subscribers.fullName",
                avatar: "$subscribers.avatar",
            }
        }
    ])
    res
    .status(200)
    .json(new ApiResponse(200, subscribers, subscribers.length==0? "You have not any Subscribers":`${subscribers.length} Subscribers found`));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log(req.params)
    if (!channelId) {
        throw new ApiError(400, "Invalid subscriber id");
    }
    const channels = await Subscription.find({subscriber: channelId}).populate("channel");
    if (!channels) {
        throw new ApiError(404, "No channels found");
    }

    res.status(200).json(new ApiResponse(200, channels, "Channels found"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}