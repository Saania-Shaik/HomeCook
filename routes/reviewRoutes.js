import express from 'express';
import { createReview, getHomemakerReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createReview);

router.route('/homemaker/:id')
  .get(getHomemakerReviews);

export default router;
