import { Router } from 'express';
import { healthcheck, healthcheckPost } from "../controllers/healthcheck.controller.js"
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.route('/').get(healthcheck);
router.route('/post').post(upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),healthcheckPost);

export default router