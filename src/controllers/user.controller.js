import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) =>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    const saveData = await user.save({ validateBeforeSave: false });
    if(!saveData){
      throw new ApiError(500, "Something went wrong while saving refresh token")
    }
    // else{
    //   console.log("Refresh token saved successfully")
    // }

    return {accessToken, refreshToken}
  } catch (error) {
    console.log("error: ", error);
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validate user details - no fields should be empty
  // check if user already exists using email,username
  // check for image check for avatar
  // create user object create entry in db
  // remove password and refresh tokens from the response
  // check for user creation
  // return response

  const { username, email, fullName, password } = req.body;
  // console.log("email: ", email);

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const exitedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // console.log("exitedUser: ", exitedUser);

  if (exitedUser) {
    throw new ApiError(409, "User with email and user already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // console.log("avatarLocalPath: ", avatarLocalPath);
  // console.log("coverImageLocalPath: ", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // console.log("user: ", user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong, User creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created Successfully"));
});

const loginUser = asyncHandler(async (req,res) => {
  // get User Credentials from frontend req body -> data
  // username or email
  // find the user in db
  // check password if user exists
  // generate access token and refresh token
  // Send secure cookie with refresh token
  // return response

  const { username, email, password } = req.body;

  if(!username && !email){
    throw new ApiError(400, "Username or Email are required");
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user){
    throw new ApiError(404, "User not found")
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid Password")
  }

  const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id);

  const loggedinUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpsOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ApiResponse(200,
    {
      user: loggedinUser,
      accessToken,
      refreshToken
    }, "User logged in successfully"));
})

const logoutUser = asyncHandler(async(req, res) => {
  // clear the refresh token from the user document
  // clear the refresh token from the cookie
  // return response

  await User.findByIdAndUpdate(
      req.user._id,
      {
          $unset: {
              refreshToken: 1 // this removes the field from document
          }
      },
      {
          new: true
      }
  )

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get refresh token from cookie
  // check if refresh token is valid
  // generate new access token
  // return response

  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token expired or use");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpsOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async(req,res) => {
  // get current user comes from auth middleware
  // get current password and new password from frontend
  // Check if current password is valid
  // update the password in db
  // return response

  const {oldPassword, newPassword} = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  
  if(!isPasswordValid){
    throw new ApiError(400, "Invalid Password")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res) => {
  // get current user from auth middleware
  // return response
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "User fetched successfully"))
}) 

const updateUserDetails = asyncHandler(async(req,res) => {
  // get current user from auth middleware
  // get updated details from frontend
  // update the user details in db
  // return response

  const {fullName, email} = req.body;
  console.log("fullName: ", fullName);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken");

  return res.
  status(200)
  .json(new ApiResponse(200, user, "User details updated successfully"))  
})

const updateUserAvatar = asyncHandler(async(req,res) => {
  // get current user from auth middleware
  // get avatar from frontend
  // get avatar url from multer middleware
  // upload avatar to cloudinary
  // update avatar url in db
  // delete image from cloudinary
  // return response

  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is missing");
  }

  const oldAvatarUrl = req.user?.avatar;
  
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar.url){
    throw new ApiError(500, "Something went wrong while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken");

  await deleteFromCloudinary(oldAvatarUrl);

  // const deleteOldImage = await deleteFromCloudinary(oldAvatarUrl);
  // if(!deleteOldImage){
  //   throw new ApiError(500, "Something went wrong while deleting old avatar");
  // }

  return res.
  status(200)
  .json(new ApiResponse(200, user, "User avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
  // get current user from auth middleware
  // get cover image from frontend
  // get cover image url from multer middleware
  // upload cover image to cloudinary
  // update cover image url in db
  // delete image from cloudinary
  // return response

  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image is missing");
  }
  
  const oldCoverImageUrl = req.user?.coverImage;

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!coverImage.url){
    throw new ApiError(500, "Something went wrong while uploading cover image");
  }  

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {
      new:true
    }
  ).select("-password -refreshToken");

  if(oldCoverImageUrl){
    await deleteFromCloudinary(oldCoverImageUrl);
    // const deleteOldImage = await deleteFromCloudinary(req.user?.coverImage);
    // if(!deleteOldImage){
    //   throw new ApiError(500, "Something went wrong while deleting old cover image");
    // }
  }

  return res
  .status(200)
  .json(new ApiResponse(200, user, "User cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
  // get username from params (url)
  // aggregate query to get user details
  // do a lookup on subscriptions collection to get subscribers count
  // do a lookup on subscriptions collection to get subscribedTo count
  // add fields to the response
  // add subscribersCount, channelSubscribedToCount, isSubscribed
  // project the username, fullName, email, avatar, coverImage, subscribersCount, channelSubscribedToCount, isSubscribed
  // check if channel exists
  // return response


  const {username} = req.params;
  if(!username?.trim()){
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match:{
        username: username.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribeTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size: "$subscribers"
        },
        channelSubscribedToCount:{
          $size: "$subscribeTo"
        },
        isSubscribed:{
          $cond:{
            if:{
              $in: [req.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project:{
        username: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404, "Channel not found");
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
})

export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
};
