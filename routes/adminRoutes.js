import express from 'express';
import {
  getPlatformStats,
  getAllUsers,
  toggleUserBan,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleUserBan);

export default router;
