import mongoose from "mongoose";

const reviewSchema =
  new mongoose.Schema(
    {
      productId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Product",
      },

      username: String,

      comment: String,

      rating: Number,

      avatar: String,

      helpful: {
        type: Number,
        default: 0,
      },
    },

    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Review",
  reviewSchema
);



/**
 * Default export
 * Required for:
 * import Product from "./models/Product.js"
 */
