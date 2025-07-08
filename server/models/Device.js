import mongoose from "mongoose";
import crypto from "crypto";

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(8).toString("hex").toUpperCase(), // 16-char unique
    },
    qrCode: {
      type: String,
      required: true, // QR image as base64 string
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null,
      },
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// 📈 Compound index for better performance on queries
deviceSchema.index({ assignedTo: 1, assignedAt: -1 });

export default mongoose.model("Device", deviceSchema);
