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
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $project: {
          _id: 1,
          content: 1,
          video: 1,
          owner: {
            _id: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
          },
          createdAt: 1,
          updatedAt: 1,
        },
      }
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

const getCommentById = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!commentId) throw new ApiError(400, "Invalid comment id");

    const comment = await Comment.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(commentId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $project: {
          _id: 1,
          content: 1,
          video: 1,
          owner: {
            _id: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
          },
          createdAt: 1,
          updatedAt: 1,
        },
      }
    ]);

    if (!comment) throw new ApiError(404, "Comment not found");

    res
      .status(200)
      .json(new ApiResponse(200, { comment }, "Comment retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const  userId  = req.user._id;

  // if(!videoId) throw new ApiError(400, "Invalid video id")
  if (!content) throw new ApiError(400, "Invalid comment content");
  // console.log(videoId, content, userId);

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

  if(comment.content === content) throw new ApiError(400, "No changes made to comment")

  comment.content = content;
  const updatedComment = await comment.save({ validateBeforeSave: false });

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

export { getVideoComments, getCommentById, addComment, updateComment, deleteComment };
