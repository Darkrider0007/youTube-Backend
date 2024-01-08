import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });    

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return;
         //upload the file on cloudinary
        const result = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type: "auto",
            }
        );
         // file has been uploaded successfully on cloudinary
        // console.log("File Upload Successfully on CLoudinary",result.url);
        fs.unlink(localFilePath);
        return result;
    } catch (error) {
        fs.unlinkSync(localFilePath);  // remove the locally saved temporary file as the upload operation got failed
        console.log("Error while uploading file on cloudinary",error);
        return null;
    }
};

export {uploadOnCloudinary}
