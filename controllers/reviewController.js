import Review from '../models/Review.js';
import Dish from '../models/Dish.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// @desc    Create a review for a homemaker/dish
// @route   POST /api/reviews
// @access  Private/Customer
export const createReview = async (req, res) => {
  const { rating, comment, dishId, orderId } = req.body;

  try {
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order is delivered before allowing review
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'You can only review delivered orders.' });
    }

    // Check if customer already reviewed this dish for this order
    const alreadyReviewed = await Review.findOne({
      customer: req.user._id,
      dish: dishId,
      // Optional: link review to order so they can't spam reviews per order
    });

    // We can allow reviews of the homemaker per order
    const review = await Review.create({
      customer: req.user._id,
      homemaker: dish.homemaker,
      dish: dishId,
      rating: Number(rating),
      comment,
    });

    // Recalculate average rating for the Homemaker
    const reviews = await Review.find({ homemaker: dish.homemaker });
    const ratingCount = reviews.length;
    const ratingAverage = reviews.reduce((acc, r) => r.rating + acc, 0) / ratingCount;

    await User.findByIdAndUpdate(dish.homemaker, {
      rating: Number(ratingAverage.toFixed(1)),
      ratingCount,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a homemaker
// @route   GET /api/reviews/homemaker/:id
// @access  Public
export const getHomemakerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ homemaker: req.params.id })
      .populate('customer', 'name avatar')
      .populate('dish', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
