import express from 'express';
import User from '../models/User.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all admins (Super Admin only)
router.get('/admins', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const admins = await User.find({ 
      role: { $in: ['normaladmin', 'superadmin'] } 
    }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;