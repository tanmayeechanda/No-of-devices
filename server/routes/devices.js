import express from "express";
import Device from "../models/Device.js";
import QRCode from "qrcode";
import crypto from "crypto";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * 🔧 Generate Devices [Normal Admin]
 */
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
        const code = crypto.randomBytes(8).toString("hex").toUpperCase(); // 16-char
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
        message: `${numberOfDevices} devices generated`,
        devices,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * 📄 Get All Devices [Super Admin]
 */
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

/**
 * ❌ Delete a Device [Super Admin]
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["superadmin"]),
  async (req, res) => {
    try {
      const deleted = await Device.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * ✅ Assign a Device to the Logged-in User [User]
 */
router.post(
  "/assign",
  authenticateToken,
  requireRole(["user"]),
  async (req, res) => {
    const { code, scannedAt, location, address } = req.body;

    if (!code) {
      return res.status(400).json({ message: "QR code is required" });
    }

    try {
      const device = await Device.findOne({ code });

      if (!device) {
        return res.status(404).json({ message: "QR code not found" });
      }

      // Case 1: Already assigned to another user
      if (
        device.assignedTo &&
        device.assignedTo.toString() !== req.user.userId
      ) {
        return res
          .status(400)
          .json({ message: "QR code already assigned to another user" });
      }

      // Case 2: Already assigned to this user → no duplication
      if (
        device.assignedTo &&
        device.assignedTo.toString() === req.user.userId
      ) {
        return res
          .status(200)
          .json({ message: "Already assigned to you", device });
      }

      // Assign the device to the user
      device.assignedTo = req.user.userId;
      device.assignedAt = scannedAt || new Date();
      device.location = location || null;
      device.address = address || null;

      await device.save();

      res.json({ message: "QR code successfully assigned", device });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * 📦 Get All Assigned Devices for Current User [User]
 */
router.get(
  "/assigned",
  authenticateToken,
  requireRole(["user"]),
  async (req, res) => {
    try {
      const devices = await Device.find({ assignedTo: req.user.userId });
      res.json({ devices }); // Array of all devices assigned to this user
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
