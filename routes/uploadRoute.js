import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import cloudinary from "../cloudinary.js"; // MUST EXIST
const router = express.Router();

// ========================================
// SERVER START DEBUG
// ========================================


// ========================================
// MULTER CONFIG
// ========================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,


});



router.get("/debug", (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKeyExists: !!process.env.CLOUDINARY_API_KEY,
    apiSecretExists: !!process.env.CLOUDINARY_API_SECRET,
  });
});


// ========================================
// UPLOAD ROUTE
// ========================================

router.post("/", upload.single("file"), async (req, res) => {
  try {
    console.log("\n====================");
    console.log("UPLOAD STARTED");
    console.log("====================\n");

    console.log("REQ FILE:", req.file);
    console.log("REQ BODY:", req.body);

    const title = req.body.title || "";
    const price = Number(req.body.price || 0);
    const description = req.body.description || "";
    const category = req.body.category || "Uncategorized";

    let uploadedUrl = "";
    let mediaType = "image";

    // ========================================
    // ONLY UPLOAD IF FILE EXISTS
    // ========================================
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video");
      mediaType = isVideo ? "video" : "image";

      console.log("🚀 UPLOADING TO CLOUDINARY...");

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "fxb-products",
          },
          (error, result) => {
            if (error) {
              console.error("CLOUDINARY ERROR:", error);
              return reject(error);
            }
            resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

      uploadedUrl = result.secure_url;

      console.log("✅ UPLOADED URL:", uploadedUrl);
    }

    // ========================================
    // CREATE PRODUCT
    // ========================================
    console.log("CREATING PRODUCT...");

    const product = await Product.create({
      title,
      price,
      description,
      category,

      image: uploadedUrl,

      media: uploadedUrl
        ? [
            {
              type: mediaType,
              url: uploadedUrl,
              status: "uploaded",
            },
          ]
        : [],

      status: "draft",
    });

    console.log("✅ PRODUCT CREATED:", product);

    res.json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("❌ UPLOAD ROUTE CRASH:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
});
export default router;