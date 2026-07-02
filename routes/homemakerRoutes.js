import express from 'express';
import {
  getHomemakerEarnings,
  followHomemaker,
  unfollowHomemaker,
  checkFollowStatus,
  getHomemakers,
} from '../controllers/homemakerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getHomemakers);

router.get('/earnings', protect, authorize('homemaker'), getHomemakerEarnings);

router.post('/:id/follow', protect, authorize('customer'), followHomemaker);
router.post('/:id/unfollow', protect, authorize('customer'), unfollowHomemaker);
router.get('/:id/follow-status', protect, authorize('customer'), checkFollowStatus);

export default router;
