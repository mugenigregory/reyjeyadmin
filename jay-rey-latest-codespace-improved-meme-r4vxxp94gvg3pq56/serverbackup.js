// ===============================
// 🚀 FXB PRODUCTION SERVER (FIXED FOR EXPRESS v5)
// ===============================
import dotenv from "dotenv";
dotenv.config();

import { initCloudinary } from "./cloudinary.js";

initCloudinary();
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import cron  from "node-cron";
import fs from "fs";
import Product from "./models/Product.js";
import axios from "axios"; // 👈 ADD THIS AT TOP
import uploadRoute from "./routes/uploadRoute.js";

const app = express();
app.use(express.json());
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
app.use(express.static(path.join(__dirname, "dist")));




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

cron.schedule("0 */2 * * *", async () => {

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





app.use(express.json());
app.use("/api/upload", uploadRoute);
// 📦 READ PRODUCTS (for frontend users)
app.get("/api/products", (req, res) => {
  const data = fs.readFileSync("./products.json", "utf-8");
  res.json(JSON.parse(data));
});





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




// ===============================
// 💾 SAVE ALL PRODUCTS (FULL REPLACE)
// ===============================
app.post("/api/products", (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: "Invalid products payload"
      });
    }

    const filePath = "./products.json";

    // 💾 overwrite entire file (THIS is your "database")
    fs.writeFileSync(
      filePath,
      JSON.stringify(products, null, 2)
    );

    res.json({
      success: true,
      message: "Products updated successfully",
      count: products.length
    });

  } catch (err) {
    console.error("❌ Save products error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to save products"
    });
  }
});


// ✏️ UPDATE PRODUCT PRICE (admin panel)
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  const filePath = "./products.json";

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const updated = data.map(p =>
    String(p.id) === String(id)   // ⚠️ FIX TYPE MISMATCH
      ? { ...p, price }
      : p
  );

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));

  res.json({ success: true, updated });
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
app.post("/api/reviews", (req, res) => {
  try {
    const newReview = req.body;

    if (!fs.existsSync(REVIEWS_FILE)) {
      fs.writeFileSync(REVIEWS_FILE, "[]");
    }

    const reviews = JSON.parse(
      fs.readFileSync(REVIEWS_FILE, "utf-8")
    );

    const reviewToSave = {
      id: Date.now().toString(),
      ...newReview,
      date: new Date().toISOString(),
      helpful: 0
    };

    reviews.push(reviewToSave);

    fs.writeFileSync(
      REVIEWS_FILE,
      JSON.stringify(reviews, null, 2)
    );

    res.json({
      success: true,
      review: reviewToSave
    });
  } catch (err) {
    console.error("❌ Save review error:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/reviews", (req, res) => {
  try {
    if (!fs.existsSync(REVIEWS_FILE)) {
      fs.writeFileSync(REVIEWS_FILE, "[]");
    }

    const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("❌ Fetch reviews error:", err);
    res.status(500).json({ success: false });
  }
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

// 🧠 GET ALL ORDERS (ADMIN + ANALYTICS)
app.get("/api/orders", (req, res) => {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, "[]");
    }

    const data = fs.readFileSync(ORDERS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    res.status(500).json({ success: false });
  }
});

// 💾 SAVE / REPLACE ALL ORDERS (SOURCE OF TRUTH)
app.post("/api/orders", (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: "Orders must be an array"
      });
    }

    fs.writeFileSync(
      ORDERS_FILE,
      JSON.stringify(orders, null, 2)
    );

    res.json({
      success: true,
      count: orders.length
    });

  } catch (err) {
    console.error("❌ Save orders error:", err);
    res.status(500).json({ success: false });
  }
});

// ✏️ UPDATE SINGLE ORDER STATUS (ADMIN PANEL)
app.put("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));

    const updated = orders.map(order =>
      String(order.id) === String(id)
        ? { ...order, status }
        : order
    );

    fs.writeFileSync(ORDERS_FILE, JSON.stringify(updated, null, 2));

    res.json({
      success: true,
      updated
    });

  } catch (err) {
    console.error("❌ Update order error:", err);
    res.status(500).json({ success: false });
  }
});


// ============================================
// 🌐 REACT SPA FALLBACK
// ============================================

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});



// ===============================
// 🚀 Start server
// ===============================
const PORT = process.env.PORT || 4100;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});