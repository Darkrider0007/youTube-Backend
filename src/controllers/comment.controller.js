import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, "Invalid video id");

    const { page = 1, limit = 10 } = req.query;
    const pageOptions = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
    ]).limit(pageOptions.limit);

    // const comments = await Comment.find({video: videoId})
    // .populate("owner")
    // // .skip(pageOptions.page * pageOptions.limit)
    // .limit(pageOptions.limit)

    if (!comments) throw new ApiError(404, "No comments found");
    if (comments.length == 0) throw new ApiError(400, "0 comments found");

    res
      .status(200)
      .json(
        new ApiResponse(200, { comments }, "Comments retrieved successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const { userId } = req.user;

  // if(!videoId) throw new ApiError(400, "Invalid video id")
  if (!content) throw new ApiError(400, "Invalid comment content");

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: userId,
  });

  res
    .status(201)
    .json(new ApiResponse(201, { comment }, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) throw new ApiError(400, "Invalid comment id");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.owner != req.user.userId)
    throw new ApiError(403, "You are not authorized to update this comment");

  comment.content = content;
  const updatedComment = await comment.save({ validateBeforeSave: true });

  res
    .status(200)
    .json(
      new ApiResponse(200, { updatedComment }, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!commentId) throw new ApiError(400, "Invalid comment id");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner != req.user.userId)
      throw new ApiError(403, "You are not authorized to delete this comment");

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) throw new ApiError(500, "Error deleting comment");

    res
      .status(200)
      .json(
        new ApiResponse(200, { deletedComment }, "Comment deleted successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
