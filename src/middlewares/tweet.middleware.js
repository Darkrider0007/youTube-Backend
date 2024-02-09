import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";



export const tweetMiddleware = asyncHandler(async (req, res, next) => {
    try {
        const { tweetId } = req.params;
        if (!tweetId) throw new ApiError(400, "tweet id is required");
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) throw new ApiError(404, "tweet not found");
        if(tweet.owner.toString() !== req.user._id.toString()) throw new ApiError(401,"user not authenticated to perform this action");
        req.tweet = tweet;
        next()
    }
    catch (error) {
        throw new ApiError(404, error?.message || "video not found");
    }
});