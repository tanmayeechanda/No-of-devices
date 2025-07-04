import express from "express";
import Device from "../models/Device.js";
import QRCode from "qrcode";
import crypto from "crypto";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// 📦 Generate devices (Normal Admin)
router.post(
  "/generate",
  authenticateToken,
  requireRole(["normaladmin"]),
  async (req, res) => {
    try {
      const { numberOfDevices } = req.body;
      const devices = [];

      for (let i = 0; i < numberOfDevices; i++) {
        const deviceName = `Device-${Date.now()}-${i + 1}`;
        const code = crypto.randomBytes(8).toString("hex").toUpperCase(); // 16 char code
        const qrImage = await QRCode.toDataURL(code);

        const device = new Device({
          name: deviceName,
          code,
          qrCode: qrImage,
          createdBy: req.user.userId,
        });

        await device.save();
        devices.push(device);
      }

      res.status(201).json({
        message: `${numberOfDevices} devices generated successfully`,
        devices,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// 🔍 Get all devices (Super Admin)
router.get(
  "/",
  authenticateToken,
  requireRole(["superadmin"]),
  async (req, res) => {
    try {
      const devices = await Device.find().populate(
        "createdBy",
        "username email"
      );
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ❌ Delete a device (Super Admin)
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["superadmin"]),
  async (req, res) => {
    try {
      const device = await Device.findByIdAndDelete(req.params.id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Assign QR to user (with location + timestamp)
router.post(
  "/assign",
  authenticateToken,
  requireRole(["user"]),
  async (req, res) => {
    const { code, scannedAt, location } = req.body;

    if (!code) {
      return res.status(400).json({ message: "QR code is required" });
    }

    try {
      // Step 1: Check if user already has a device assigned
      const existing = await Device.findOne({ assignedTo: req.user.userId });
      if (existing) {
        return res
          .status(400)
          .json({
            message: "You have already scanned and been assigned a device.",
          });
      }

      // Step 2: Check if QR code exists
      const device = await Device.findOne({ code });

      if (!device) {
        return res.status(404).json({ message: "QR code not found" });
      }

      // Step 3: Ensure it's not assigned to another user
      if (
        device.assignedTo &&
        device.assignedTo.toString() !== req.user.userId
      ) {
        return res
          .status(400)
          .json({ message: "QR code already assigned to another user" });
      }

      // Step 4: Assign QR to user
      device.assignedTo = req.user.userId;
      device.assignedAt = scannedAt || new Date();
      device.location = location || null;

      await device.save();

      res.json({ message: "QR code successfully assigned", device });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// 📦 Get assigned device of the logged-in user
router.get(
  "/assigned",
  authenticateToken,
  requireRole(["user"]),
  async (req, res) => {
    try {
      const device = await Device.findOne({ assignedTo: req.user.userId });

      if (!device) {
        return res.status(404).json({ message: "No device assigned yet" });
      }

      res.json({ device });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
