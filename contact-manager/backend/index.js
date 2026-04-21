import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import contactRoutes from "./routes/contacts.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/contact_manager";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`🟢 Contact Manager connected to MongoDB: ${MONGO_URI}`))
  .catch((err) => {
    console.error("🔴 Contact Manager MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/", (_req, res) => {
  res.json({
    message: "Contact Manager API is running",
    endpoints: {
      "GET /api/contacts": "List contacts, optional ?q=search",
      "POST /api/contacts": "Create a contact",
      "GET /api/contacts/:id": "Fetch one contact",
      "PUT /api/contacts/:id": "Update one contact",
      "DELETE /api/contacts/:id": "Delete one contact",
    },
  });
});

app.use("/api/contacts", contactRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`📇 Contact Manager API running at http://localhost:${PORT}`);
});
