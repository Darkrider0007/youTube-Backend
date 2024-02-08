import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {getVideoAndThumbnailURL}  from '../middlewares/video.middleware.js';

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(getVideoAndThumbnailURL,deleteVideo)
    .patch(upload.single("thumbnail"),getVideoAndThumbnailURL, updateVideo);

router.route("/toggle/publish/:videoId").patch(getVideoAndThumbnailURL,togglePublishStatus);

router.route("/listAllVideos/:ownerId").get(getAllVideos);

export default router