import { asyncHandler } from "../utils/asyncHandler.js";
import Video from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js";


export const getVideoAndThumbnailURL = asyncHandler(async (req, _, next) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "video not found");
    const ownerId = req.user?._id ;
    if(video.owner.toString() !== ownerId.toString()) throw new ApiError(401,"user not authenticated to perform this action");
    req.video = video;
    next();
  } catch (error) {
    throw new ApiError(404, error?.message || "video not found");
  }
});