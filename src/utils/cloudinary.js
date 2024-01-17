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
        fs.unlinkSync(localFilePath);
        return result;
    } catch (error) {
        fs.unlinkSync(localFilePath);  // remove the locally saved temporary file as the upload operation got failed
        console.log("Error while uploading file on cloudinary",error);
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      console.log("No publicId provided");
      return null; // return null or throw an error depending on your use case
    }

    // Extract file name without extension from the publicId
    const imageUrl = publicId.split("/");
    const fileNameWithoutExtension = imageUrl[imageUrl.length - 1].split(".")[0];
    console.log("File name without extension", fileNameWithoutExtension);

    // Delete the image from Cloudinary
    await cloudinary.uploader.destroy(fileNameWithoutExtension, function(error,result) {
      console.log(result, error) }) 

    // console.log("File deleted successfully from Cloudinary", deleteImage);

    // return deleteImage;
  } catch (error) {
    console.error("Error while deleting file on Cloudinary", error);
    throw error; // Throw the error to handle it at a higher level or return null
  }
};


export { uploadOnCloudinary, deleteFromCloudinary };
