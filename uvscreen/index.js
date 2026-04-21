import "dotenv/config";
import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import UVCheck from "./models/UVCheck.js";

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/uvscreen";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`🟢 UVScreen connected to MongoDB: ${MONGO_URI}`))
  .catch((err) => {
    console.error("🔴 UVScreen MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Middleware ────────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ── Axios instance for OpenUV API ────────────────────────────────────────────
const uvApi = axios.create({
  baseURL: "https://api.openuv.io/api/v1",
  headers: { "x-access-token": process.env.OPENUV_API_KEY },
  timeout: 10000,
});

// Request interceptor – log outgoing calls (useful for debugging)
uvApi.interceptors.request.use((config) => {
  console.log(`→ OpenUV  ${config.method.toUpperCase()}  ${config.url}`);
  return config;
});

// Response interceptor – unwrap .data automatically
uvApi.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.error || err.message;
    console.error(`✖ OpenUV error (${status}): ${msg}`);
    return Promise.reject(new Error(msg));
  }
);

// ── Helpers ──────────────────────────────────────────────────────────────────
function classifyUV(uv) {
  if (uv <= 2) return { level: "Low", color: "#4ade80", emoji: "😎", advice: "Enjoy the outdoors! Sunscreen is optional for most people.", needsSunscreen: false };
  if (uv <= 5) return { level: "Moderate", color: "#facc15", emoji: "🧴", advice: "Wear sunscreen SPF 30+. Seek shade during midday hours.", needsSunscreen: true };
  if (uv <= 7) return { level: "High", color: "#fb923c", emoji: "⚠️", advice: "Sunscreen SPF 50+ is essential. Wear a hat and sunglasses.", needsSunscreen: true };
  if (uv <= 10) return { level: "Very High", color: "#ef4444", emoji: "🔴", advice: "Minimize sun exposure between 10 AM – 4 PM. Full protection required.", needsSunscreen: true };
  return { level: "Extreme", color: "#a855f7", emoji: "☠️", advice: "Avoid sun exposure entirely if possible. Seek shade, cover up, SPF 50+.", needsSunscreen: true };
}

function formatTime(isoStr) {
  if (!isoStr) return "N/A";
  return new Date(isoStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Home – landing page with coordinate form
app.get("/", async (_req, res) => {
  let recentSearches = [];

  try {
    recentSearches = await UVCheck.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  } catch (err) {
    console.error("Failed to load recent UV searches:", err.message);
  }

  res.render("index", { recentSearches });
});

// Check – fetch UV data and render results
app.post("/check", async (req, res) => {
  const lat = parseFloat(req.body.lat);
  const lng = parseFloat(req.body.lng);

  // Basic validation
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.render("error", {
      title: "Invalid Coordinates",
      message: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180).",
    });
  }

  try {
    // Fire all three API calls concurrently with Promise.all
    const [uvData, protectionData, forecastData] = await Promise.all([
      uvApi.get("/uv", { params: { lat, lng } }),
      uvApi.get("/protection", { params: { lat, lng, from: 3, to: 10 } }),
      uvApi.get("/forecast", { params: { lat, lng } }),
    ]);

    const currentUV = uvData.result.uv;
    const maxUV = uvData.result.uv_max;
    const classification = classifyUV(currentUV);
    const maxClassification = classifyUV(maxUV);

    // The verdict answers "do you need sunscreen TODAY?" — based on max UV, not current
    const verdict = maxClassification;

    // Build hourly forecast array for the chart
    const forecast = (forecastData.result || []).map((entry) => ({
      hour: new Date(entry.uv_time).getHours(),
      uv: entry.uv,
      classification: classifyUV(entry.uv),
    }));

    // Protection window
    const protection = {
      from: formatTime(protectionData.result?.from_time),
      to: formatTime(protectionData.result?.to_time),
    };

    let historySaved = false;

    try {
      await UVCheck.create({
        lat,
        lng,
        currentUV,
        maxUV,
        ozone: uvData.result.ozone ?? null,
        uvTime: uvData.result.uv_time ? new Date(uvData.result.uv_time) : null,
        maxUVTime: uvData.result.uv_max_time ? new Date(uvData.result.uv_max_time) : null,
        protectionFrom: protectionData.result?.from_time ? new Date(protectionData.result.from_time) : null,
        protectionTo: protectionData.result?.to_time ? new Date(protectionData.result.to_time) : null,
        verdictLevel: verdict.level,
        needsSunscreen: verdict.needsSunscreen,
      });
      historySaved = true;
    } catch (historyErr) {
      console.error("Failed to save UV history:", historyErr.message);
    }

    res.render("result", {
      lat,
      lng,
      currentUV: currentUV.toFixed(1),
      maxUV: maxUV.toFixed(1),
      maxUVTime: formatTime(uvData.result.uv_max_time),
      ozone: uvData.result.ozone?.toFixed(0) || "N/A",
      classification,
      maxClassification,
      verdict,
      protection,
      forecast,
      uvTime: formatTime(uvData.result.uv_time),
      historySaved,
    });
  } catch (err) {
    console.error("Route /check error:", err.message);
    res.render("error", {
      title: "API Error",
      message: err.message || "Failed to retrieve UV data. Please try again later.",
    });
  }
});

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you are looking for does not exist.",
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`☀️  Sunscreen Advisor running at http://localhost:${PORT}`);
});
