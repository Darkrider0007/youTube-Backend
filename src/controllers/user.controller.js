import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { 
  registerUser,
  loginUser,
  logoutUser
};
