import { Router } from "express";
import User from "../models/User.js";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
//  CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ── POST /users — Create a new user ─────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();
    res.status(201).json(saved);
  } catch (err) {
    // Duplicate key error (MongoDB error code 11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        error: `Duplicate value for '${field}': '${err.keyValue[field]}'`,
      });
    }
    // Mongoose validation error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: "Validation failed", details: messages });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── GET /users — Retrieve all users (with pagination & sorting) ─────────────
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /users/:id — Retrieve a single user by MongoDB _id ─────────────────
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: `User with id '${req.params.id}' not found` });
    }
    res.json(user);
  } catch (err) {
    // Invalid ObjectId format
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: `Invalid id format: '${req.params.id}'` });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /users/:id — Update user by ID (full replace) ──────────────────────
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,             // return updated document
      runValidators: true,   // run schema validations on update
      overwrite: true,       // PUT semantics: replace entire document
    });
    if (!user) {
      return res.status(404).json({ error: `User with id '${req.params.id}' not found` });
    }
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        error: `Duplicate value for '${field}': '${err.keyValue[field]}'`,
      });
    }
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: "Validation failed", details: messages });
    }
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: `Invalid id format: '${req.params.id}'` });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /users/:id — Delete user by ID ───────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: `User with id '${req.params.id}' not found` });
    }
    res.json({ message: `User '${user.name}' deleted`, user });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: `Invalid id format: '${req.params.id}'` });
    }
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  QUERYING & FILTERING
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /users/search/name?q=... — Search users by name (regex) ─────────────
router.get("/search/name", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    // Case-insensitive regex search — uses the single field index on name
    const users = await User.find({ name: { $regex: q, $options: "i" } });
    res.json({ count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /users/filter?email=...&age=... — Filter by email and/or age ────────
router.get("/filter", async (req, res) => {
  try {
    const filter = {};
    if (req.query.email) filter.email = req.query.email.toLowerCase();
    if (req.query.age) filter.age = parseInt(req.query.age);
    if (req.query.minAge) filter.age = { ...filter.age, $gte: parseInt(req.query.minAge) };
    if (req.query.maxAge) filter.age = { ...filter.age, $lte: parseInt(req.query.maxAge) };

    // Uses the compound index on { email: 1, age: -1 }
    const users = await User.find(filter);
    res.json({ count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /users/search/hobbies?hobby=... — Find users by hobby ───────────────
router.get("/search/hobbies", async (req, res) => {
  try {
    const { hobby } = req.query;
    if (!hobby) {
      return res.status(400).json({ error: "Query parameter 'hobby' is required" });
    }
    // Uses the multikey index on hobbies
    const users = await User.find({ hobbies: hobby });
    res.json({ count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /users/search/bio?q=... — Full-text search on bio ───────────────────
router.get("/search/bio", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    // Uses the text index on bio — $text performs full-text search
    const users = await User.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }  // include relevance score
    ).sort({ score: { $meta: "textScore" } });  // sort by relevance

    res.json({ count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
