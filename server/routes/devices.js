import express from "express";
import Device from "../models/Device.js";
import QRCode from "qrcode";
import crypto from "crypto";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Generate devices (Normal Admin)
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
        const code = crypto.randomBytes(8).toString("hex").toUpperCase(); // 8 bytes = 16 hex chars

        const qrImage = await QRCode.toDataURL(code);

        const device = new Device({
          name: deviceName,
          code: code,
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

// Get all devices (Super Admin)
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

// Delete device (Super Admin)
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

// ✅ Assign QR to user
router.post(
  "/assign",
  authenticateToken,
  requireRole(["user"]),
  async (req, res) => {
    const { code } = req.body;

    try {
      const device = await Device.findOne({ code });

      if (!device) {
        return res.status(404).json({ message: "QR code not found" });
      }

      if (device.assignedTo) {
        return res
          .status(400)
          .json({ message: "QR code already assigned to another user" });
      }

      device.assignedTo = req.user.userId;
      await device.save();

      res.json({ message: "QR code successfully assigned", device });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get assigned device of the logged-in user
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
