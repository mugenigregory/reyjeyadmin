import { v2 as cloudinary } from "cloudinary";

// =======================================
// CLOUDINARY INITIALIZATION FUNCTION
// MUST BE CALLED BEFORE ANY UPLOAD
// =======================================
export function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log("✅ Cloudinary initialized");
  console.log("CLOUD:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("KEY EXISTS:", !!process.env.CLOUDINARY_API_KEY);
}

// export SAME instance everywhere
export default cloudinary;