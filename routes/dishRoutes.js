import express from 'express';
import {
  createDish,
  getDishes,
  getDishById,
  updateDish,
  deleteDish,
} from '../controllers/dishController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getDishes)
  .post(protect, authorize('homemaker'), upload.single('image'), createDish);

router
  .route('/:id')
  .get(getDishById)
  .put(protect, authorize('homemaker'), upload.single('image'), updateDish)
  .delete(protect, authorize('homemaker'), deleteDish);

export default router;
