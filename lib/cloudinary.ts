import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "uploads"
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const uploadBase64ToCloudinary = async (
  base64String: string,
  folder: string = "profiles"
): Promise<any> => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    throw error;
  }
};

export default cloudinary;
