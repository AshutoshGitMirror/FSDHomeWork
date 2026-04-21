import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Feedback from "./models/Feedback.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/student_feedback_system";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`🟢 Student Feedback connected to MongoDB: ${MONGO_URI}`))
  .catch((err) => {
    console.error("🔴 Student Feedback MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/feedback", async (_req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 }).lean();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch feedback" });
  }
});

app.post("/feedback", async (req, res) => {
  try {
    const feedback = await Feedback.create({
      studentName: req.body.studentName,
      courseName: req.body.courseName,
      rating: Number(req.body.rating),
      comments: req.body.comments,
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to submit feedback" });
  }
});

app.delete("/feedback/:id", async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete feedback" });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(new URL("./public/index.html", import.meta.url).pathname);
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`📝 Student Feedback System running at http://localhost:${PORT}`);
});
