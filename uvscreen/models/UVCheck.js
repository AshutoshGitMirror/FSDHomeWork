import mongoose from "mongoose";

const uvCheckSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    currentUV: {
      type: Number,
      required: true,
      min: 0,
    },
    maxUV: {
      type: Number,
      required: true,
      min: 0,
    },
    ozone: {
      type: Number,
      default: null,
    },
    uvTime: {
      type: Date,
      default: null,
    },
    maxUVTime: {
      type: Date,
      default: null,
    },
    protectionFrom: {
      type: Date,
      default: null,
    },
    protectionTo: {
      type: Date,
      default: null,
    },
    verdictLevel: {
      type: String,
      required: true,
      trim: true,
    },
    needsSunscreen: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

uvCheckSchema.index({ createdAt: -1 });
uvCheckSchema.index({ lat: 1, lng: 1 });

const UVCheck = mongoose.model("UVCheck", uvCheckSchema);

export default UVCheck;
