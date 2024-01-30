import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    res.status(200).json(new ApiResponse(200, "OK", "Healthcheck OK"))
})

const healthcheckPost = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;
    console.log("email: ", email);
    // console.log(req.body)
    // if (!message) {
    //     throw new ApiError(400,"Message is required")
    // }
    res.status(200).json(new ApiResponse(200, "OK", "Healthcheck OK"))
})

export {
    healthcheck,
    healthcheckPost
    }
    