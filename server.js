// ===============================
// 🚀 FXB PRODUCTION SERVER (FIXED FOR EXPRESS v5)
// ===============================

console.log("1️⃣ server.js starting");

import dotenv from "dotenv";
dotenv.config();
console.log("2️⃣ dotenv loaded");
import { initCloudinary } from "./cloudinary.js";
console.log("3️⃣ cloudinary module imported");

initCloudinary();
console.log("3️⃣ cloudinary module imported");

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import cron  from "node-cron";
import fs from "fs";
import Product from "./models/Product.js";
import Review from "./models/Review.js";
import Order from "./models/Order.js";
import axios from "axios"; // 👈 ADD THIS AT TOP

const app = express();
console.log("6️⃣ creating express app");
// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORDERS_FILE = "./orders.json";
const REVIEWS_FILE = "./reviews.json";
const SUBSCRIPTIONS_FILE = "./subscriptions.json";





// ============================================
// 🌍 FXB MONGODB CONNECTION
// ============================================

import mongoose from "mongoose";

const connectDB = async () => {
  try {

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB Connected"
    );

  } catch (err) {

    console.error(
      "❌ MongoDB Error:",
      err
    );

    process.exit(1);
  }
};


/**
 * ACTUALLY RUN CONNECTION
 */
connectDB();


import uploadRoute from "./routes/uploadRoute.js";
console.log("8️⃣ importing upload route");
// ===============================
// 📦 SUBSCRIPTION STORAGE HELPERS
// (Simple JSON "DB" like your products/orders system)
// ===============================

const loadSubscriptions = () => {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, "[]");
  }

  return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, "utf-8"));
};

const saveSubscriptions = (subs) => {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
};

// Serve all public assets FIRST
app.use(express.static("public"));

// Serve Vite build files
app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "adminlogin.html"
    )
  );

});


app.post(
  "/api/admin/login",
  (req, res) => {

    const {
      username,
      password
    } = req.body;

    if (
      username ===
        process.env.ADMIN_USER &&
      password ===
        process.env.ADMIN_PASSWORD
    ) {

      return res.json({
        success:true
      });

    }

    res.status(401).json({
      success:false
    });

});



      // Replace with your actual Render app URL
      const PING_URL = "https://www.jeyrey.onrender.com";

// ===============================
// 🔔 FXB NOTIFICATION POOL
// ===============================

const notificationPool = [
  {
    title: "🔥 Flash Sale Live",
    message: "New deals just dropped on Jeyrey"
  },

  {
    title: "🆕 New Arrivals",
    message: "Fresh products are now available"
  },

  {
    title: "⚡ Trending Products",
    message: "Customers are loving the latest gadgets"
  },

  {
    title: "🎁 Weekend Specials",
    message: "Exclusive offers available for a limited time"
  },

  {
    title: "📦 Discover Something New",
    message: "Explore products added recently"
  },

  {
    title: "💸 Limited Time Offers",
    message: "Some prices just got updated"
  },

  {
    title: "🚀 FXB Updates",
    message: "The Jeyrey experience keeps getting better"
  },

  {
    title: "👀 Popular Right Now",
    message: "Check out what shoppers are viewing"
  }
];

// Schedule a job to run every 14 minutes

cron.schedule("*/14 * * * *", async () => {
  try {
    console.log("📡 Pinging server...");

    const response = await axios.get(PING_URL);

    console.log(
      `✅ App pinged successfully: ${response.status}`
    );
  } catch (error) {
    console.error(
      "❌ Error pinging app:",
      error.message
    );
  }
});

console.log("🚀 Cron job scheduled to keep the app awake.");








// ===============================
// 🤖 AUTO SEND RANDOM PUSH
// ===============================

const sendRandomNotification = async () => {
  try {

    const subs = loadSubscriptions();

    if (!subs.length) {
      console.log("⚠️ No subscribers found");
      return;
    }

    // pick random notification
    const random =
      notificationPool[
        Math.floor(Math.random() * notificationPool.length)
      ];

    const payload = JSON.stringify(random);

    console.log(
      `🔔 Sending auto push: ${random.title}`
    );

    const validSubs = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {

          await webpush.sendNotification(
            sub,
            payload
          );

          validSubs.push(sub);

        } catch (err) {

          // remove expired devices
          if (
            err.statusCode === 404 ||
            err.statusCode === 410
          ) {
            console.log("🧹 Removing dead subscription");
            return;
          }

          console.error(
            "Push auto-send error:",
            err.message
          );
        }
      })
    );

    // save cleaned subscriptions
    saveSubscriptions(validSubs);

    console.log(
      `✅ Auto push sent to ${validSubs.length} users`
    );

  } catch (err) {
    console.error(
      "❌ Random notification error:",
      err
    );
  }
};




// ===============================
// ⏰ SEND PUSH EVERY 2 HOURS
// ===============================

cron.schedule("*/30 * * * *", async () => {
  console.log("⏰ Running scheduled push notifications");

  await sendRandomNotification();

});

// ===============================
// 🔐 VAPID KEYS (PUT YOURS HERE)
// ===============================
const publicVapidKey = 'BNeGpTTHVmpyO7dJMqCMd-1thKIBErmgkYPgu5vxgYgcTuIb1zwrHnXkt0LjuZmqm1qPUK3PucuXbVYWCPwUEtg';
const privateVapidKey = 'PfJj0aBrifu3yQw9wGzrgbeb8Hx9KeRMlLhi5EnOzRw';

webpush.setVapidDetails(
  'mailto:gregorymugeni@gmail.com',
  publicVapidKey,
  privateVapidKey
);





app.use("/api/upload", uploadRoute);
app.use(express.json());             // ← then json for everything else






// ===============================
// 📥 SAVE USER SUBSCRIPTION
// ===============================
app.post("/subscribe", (req, res) => {
  try {
    const subscription = req.body;

    // ===============================
    // 🛑 VALIDATION CHECK
    // ===============================
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription object"
      });
    }

    const subs = loadSubscriptions();

    // ===============================
    // 🔁 PREVENT DUPLICATES
    // ===============================
    const exists = subs.find(
      (s) => s.endpoint === subscription.endpoint
    );

    if (!exists) {
      subs.push(subscription);
      saveSubscriptions(subs);

      console.log("✅ New push subscriber saved");
    } else {
      console.log("⚠️ Subscriber already exists");
    }

    res.status(201).json({
      success: true,
      message: "Subscribed successfully"
    });

  } catch (err) {
    console.error("❌ Subscribe error:", err);
    res.status(500).json({ success: false });
  }
});
 


// ===============================
// 🔔 SEND PUSH NOTIFICATION
// ===============================
app.post("/send", async (req, res) => {
  try {

    const { title, message } = req.body;

    const payload = JSON.stringify({
      title,
      message,
    });

    const subs = loadSubscriptions();

    if (!subs.length) {
      return res.status(404).json({
        success: false,
        message: "No subscribers found"
      });
    }

    const validSubs = [];

    await Promise.all(
      subs.map(async (sub) => {

        try {

          await webpush.sendNotification(
            sub,
            payload
          );

          validSubs.push(sub);

        } catch (err) {

          // remove expired subscriptions
          if (
            err.statusCode === 404 ||
            err.statusCode === 410
          ) {

            console.log(
              "🧹 Removing dead subscription"
            );

            return;
          }

          console.error(
            "❌ Push send error:",
            err.message
          );
        }
      })
    );

    // save cleaned subscriptions
    saveSubscriptions(validSubs);

    res.json({
      success: true,
      message: "Notifications sent!",
      total: validSubs.length
    });

  } catch (err) {

    console.error(
      "❌ Send notification error:",
      err
    );

    res.status(500).json({
      success: false
    });
  }
});


// ============================================
// ✏️ UPDATE PRODUCT
// ============================================

app.put("/api/products/:id", async (req, res) => {
  try {

    const updated =
      await Product.findByIdAndUpdate(
        req.params.id,

        req.body,

        {
          new: true,
        }
      );

    res.json({
      success: true,
      updated,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
    });
  }
});

// ===============================
// 📦 STORE SUBSCRIPTIONS (TEMP DB)
// (Replace with MongoDB later)
// ===============================
//let subscriptions = [];


// ===============================
// 🔔 SEND PUSH NOTIFICATION
// ===============================
/*app.post("/subscribe", (req, res) => {
  try {
    const subscription = req.body;

    // ===============================
    // 🛑 VALIDATION CHECK
    // ===============================
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription object"
      });
    }

    const subs = loadSubscriptions();

    // ===============================
    // 🔁 PREVENT DUPLICATES
    // ===============================
    const exists = subs.find(
      (s) => s.endpoint === subscription.endpoint
    );

    if (!exists) {
      subs.push(subscription);
      saveSubscriptions(subs);

      console.log("✅ New push subscriber saved");
    } else {
      console.log("⚠️ Subscriber already exists");
    }

    res.status(201).json({
      success: true,
      message: "Subscribed successfully"
    });

  } catch (err) {
    console.error("❌ Subscribe error:", err);
    res.status(500).json({ success: false });
  }
});
*/
app.get("/api/reviews", async (req, res) => {
  const reviews = await Review.find();

  res.json(reviews);
});

app.post("/api/reviews", async (req, res) => {
  const review =
    await Review.create(req.body);

  res.json(review);
});

app.put("/api/reviews/:id/helpful", (req, res) => {
  try {
    const { id } = req.params;

    const reviews = JSON.parse(
      fs.readFileSync(REVIEWS_FILE, "utf-8")
    );

    const updated = reviews.map(r =>
      r.id === id ? { ...r, helpful: r.helpful + 1 } : r
    );

    fs.writeFileSync(
      REVIEWS_FILE,
      JSON.stringify(updated, null, 2)
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});


// ===============================
// 📦 ORDERS DATABASE (JSON FILE)
// ===============================

// ============================================
// 📦 GET PRODUCTS
// ============================================

app.get("/api/products", async (req, res) => {
  try {

    const products =
      await Product.find().sort({
        createdAt: -1,
      });


// ===============================
// 📦 GET ORDERS
// ===============================
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    const clean = orders.map(o => ({
      id: o._id,
      ...o.toObject(),
    }));

    res.json(clean);
  } catch (err) {
    console.error("❌ Orders fetch error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
});


const cleanProducts = products.map(p => ({
  id: p._id,
  ...p.toObject()
}));

res.json(cleanProducts);


  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
    });
  }
});


// ===============================
// 🧾 CREATE NEW ORDER
// ===============================
app.post("/api/orders", async (req, res) => {
  try {
    const { products, total, userId, status } = req.body;

    // ===============================
    // 🔐 VALIDATION
    // ===============================
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must include products",
      });
    }

    if (!total || isNaN(Number(total))) {
      return res.status(400).json({
        success: false,
        message: "Invalid order total",
      });
    }

    // ===============================
    // 💾 CREATE ORDER
    // ===============================
    const order = await Order.create({
      products,
      total: Number(total),
      userId: userId || "guest",
      status: status || "pending",
    });

    console.log("✅ ORDER CREATED:", order._id);

    // ===============================
    // RESPONSE
    // ===============================
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order._id,
        ...order.toObject(),
      },
    });

  } catch (err) {
    console.error("❌ POST order error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
});
// ============================================
// 🗑 DELETE PRODUCT
// ============================================


app.delete("/api/products/:id", async (req, res) => {

  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {

      return res.status(400).json({
        success:false,
        message:"Invalid product id"
      });

    }

    await Product.findByIdAndDelete(id);

    res.json({
      success:true
    });

  } catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});

// ============================================
// 💾 CREATE PRODUCT
// ============================================


// ============================================
// 🌐 REACT SPA FALLBACK
// ============================================




// ===============================
// 🚀 Start server
// ===============================
const PORT = process.env.PORT || 4100;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
