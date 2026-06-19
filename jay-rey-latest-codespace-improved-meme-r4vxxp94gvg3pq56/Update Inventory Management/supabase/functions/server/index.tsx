import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-fdb4ad6b/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== PRODUCTS API ====================

// Get all products
app.get("/make-server-fdb4ad6b/products", async (c) => {
  try {
    const products = await kv.get("products") || [];
    return c.json({ success: true, products });
  } catch (error) {
    console.log("Error fetching products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update all products (used by AdminPanel and InventoryManagement)
app.post("/make-server-fdb4ad6b/products", async (c) => {
  try {
    const { products } = await c.req.json();
    await kv.set("products", products);
    return c.json({ success: true, products });
  } catch (error) {
    console.log("Error updating products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==================== IMAGE UPLOAD ====================

// Upload image to Cloudinary
app.post("/make-server-fdb4ad6b/upload-image", async (c) => {
  try {
    const { image } = await c.req.json();

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    const uploadPreset = Deno.env.get("CLOUDINARY_UPLOAD_PRESET");

    if (!cloudName || !apiKey || !apiSecret) {
      return c.json({
        success: false,
        error: "Cloudinary credentials not configured"
      }, 500);
    }

    // Generate timestamp for signature
    const timestamp = Math.round(Date.now() / 1000);

    // Create signature
    const crypto = await import("node:crypto");
    const paramsToSign = `timestamp=${timestamp}&upload_preset=${uploadPreset}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", image);
    formData.append("timestamp", timestamp.toString());
    formData.append("upload_preset", uploadPreset);
    formData.append("api_key", apiKey);
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.log("Cloudinary upload error:", result);
      return c.json({
        success: false,
        error: result.error?.message || "Upload failed"
      }, 500);
    }

    return c.json({
      success: true,
      url: result.secure_url
    });
  } catch (error) {
    console.log("Error uploading image:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);