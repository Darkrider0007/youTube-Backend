import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import { extractPublicId } from "cloudinary-build-url"

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
        fs.unlinkSync(localFilePath);
        return result;
    } catch (error) {
        fs.unlinkSync(localFilePath);  // remove the locally saved temporary file as the upload operation got failed
        console.log("Error while uploading file on cloudinary",error);
        return null;
    }
};

const deleteFromCloudinary = async (url, resourceType = "image") => {
  const publicId = extractPublicId(url);
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return response;
  } catch (error) {
    console.error("Error while deleting file on Cloudinary", error);
    throw error; // Throw the error to handle it at a higher level or return null
  }
};


export { uploadOnCloudinary, deleteFromCloudinary };
