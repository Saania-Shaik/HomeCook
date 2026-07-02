import express from 'express';
import {
  createSpecialRequest,
  getSpecialRequests,
  acceptSpecialRequest,
  createDishForRequest,
} from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createSpecialRequest)
  .get(getSpecialRequests);

router.route('/:id/accept')
  .put(authorize('homemaker'), acceptSpecialRequest);

router.route('/:id/dish')
  .post(authorize('homemaker'), upload.single('image'), createDishForRequest);

export default router;
