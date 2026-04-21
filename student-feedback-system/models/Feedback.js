import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: [2, "Student name must be at least 2 characters"],
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      minlength: [2, "Course name must be at least 2 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be greater than 5"],
    },
    comments: {
      type: String,
      required: [true, "Comments are required"],
      trim: true,
      minlength: [3, "Comments must be at least 3 characters"],
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ courseName: 1, createdAt: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
