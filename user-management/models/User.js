import mongoose from "mongoose";

// ── User Schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: [3, "Name must be at least 3 characters"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  age: {
    type: Number,
    min: [0, "Age cannot be negative"],
    max: [120, "Age cannot exceed 120"],
  },
  hobbies: {
    type: [String],
    default: [],
  },
  bio: {
    type: String,
    trim: true,
  },
  userId: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Indexes ──────────────────────────────────────────────────────────────────

// 1. Single field index on name — speeds up searches/sorts by name
userSchema.index({ name: 1 });

// 2. Compound index on email and age — optimises queries filtering by both
userSchema.index({ email: 1, age: -1 });

// 3. Multikey index on hobbies — indexes each element of the array
userSchema.index({ hobbies: 1 });

// 4. Text index on bio — enables full-text search ($text operator)
userSchema.index({ bio: "text" });

// 5. Hashed index on userId — even distribution for sharding/lookups
userSchema.index({ userId: "hashed" });

// 6. TTL index on createdAt — auto-deletes documents after 24 hours (86400s)
//    NOTE: In production you'd likely NOT want users auto-deleted.
//    This is for demonstration purposes as required by the assignment.
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const User = mongoose.model("User", userSchema);

export default User;
