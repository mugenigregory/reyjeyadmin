import mongoose from "mongoose";

const orderSchema =
  new mongoose.Schema(
    {
      customerName: String,

      items: Array,

      total: Number,

      status: {
        type: String,

        default: "pending",
      },
    },

    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Order",
  orderSchema
);



/**
 * Default export
 * Required for:
 * import Product from "./models/Product.js"
 */
