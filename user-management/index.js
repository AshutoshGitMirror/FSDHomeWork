import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27018/user_management";

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());

// ── Database Connection ─────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🟢 Connected to MongoDB:", MONGO_URI))
  .catch((err) => {
    console.error("🔴 MongoDB connection error:", err.message);
    process.exit(1);
  });

mongoose.connection.on("disconnected", () => {
  console.log("🟡 MongoDB disconnected");
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/users", userRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "User Management API is running",
    endpoints: {
      "GET /users": "Retrieve all users (supports ?page=1&limit=10)",
      "POST /users": "Create a new user",
      "GET /users/:id": "Retrieve a specific user by ID",
      "PUT /users/:id": "Update a specific user by ID",
      "DELETE /users/:id": "Delete a specific user by ID",
      "GET /users/search/name?q=...": "Search users by name",
      "GET /users/filter?email=...&age=...": "Filter by email and age",
      "GET /users/search/hobbies?hobby=...": "Find users by hobby",
      "GET /users/search/bio?q=...": "Text search on bio field"
    }
  });
});

// ── Error Handling for non-existent routes ──────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 User Management API server running on port ${PORT}`);
});
