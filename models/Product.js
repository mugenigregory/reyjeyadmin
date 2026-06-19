// ============================================
// 🛍 FXB TECHNOLOGY PRODUCT MODEL
// ES MODULE VERSION
// ============================================

import mongoose from "mongoose";

/**
 * Product schema
 * Controls all marketplace product data
 */
const productSchema = new mongoose.Schema(
  {
    // Product name
    title: {
      type: String,
    },

    // Product description
    description: {
      type: String,
      default: "",
    },

    // Main product image
    image: {
      type: String,
    },

    // Product price
    price: {
      type: Number,
    },

    // Product category
    category: {
      type: String,
      default: "general",
    },

    // Average product rating
    rating: {
      type: Number,
      default: 0,
    },

    // Inventory stock count
    stock: {
      type: Number,
      default: 0,
    },

    // Featured product toggle
    featured: {
      type: Boolean,
      default: false,
    },

    // Tags for search & recommendations
    tags: [String],
  },

  {
    timestamps: true,
  }
);

/**
 * Create model
 */
const Product = mongoose.model(
  "Product",
  productSchema
);

/**
 * Default export
 * Required for:
 * import Product from "./models/Product.js"
 */
export default Product;