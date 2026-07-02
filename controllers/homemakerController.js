import Order from '../models/Order.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';

// @desc    Get homemaker earnings analytics
// @route   GET /api/homemakers/earnings
// @access  Private/Homemaker
export const getHomemakerEarnings = async (req, res) => {
  try {
    const homemakerId = req.user._id;

    // Filter to only delivered orders
    const orders = await Order.find({ homemaker: homemakerId, status: 'delivered' });

    const totalOrders = orders.length;

    // Time calculations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);

    let todayEarnings = 0;
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;
    let totalEarnings = 0;

    orders.forEach((order) => {
      const orderDate = new Date(order.updatedAt); // Delivered date
      totalEarnings += order.totalPrice;

      if (orderDate >= startOfToday) {
        todayEarnings += order.totalPrice;
      }
      if (orderDate >= startOfWeek) {
        weeklyEarnings += order.totalPrice;
      }
      if (orderDate >= startOfMonth) {
        monthlyEarnings += order.totalPrice;
      }
    });

    // Provide chart-ready daily data for the past 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dailyOrders = orders.filter(
        (o) => new Date(o.updatedAt) >= dayStart && new Date(o.updatedAt) <= dayEnd
      );
      const dailyRevenue = dailyOrders.reduce((sum, o) => sum + o.totalPrice, 0);

      dailyStats.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: dailyRevenue,
        count: dailyOrders.length,
      });
    }

    res.json({
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalEarnings,
      totalOrders,
      dailyStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow a homemaker
// @route   POST /api/homemakers/:id/follow
// @access  Private/Customer
export const followHomemaker = async (req, res) => {
  try {
    const homemakerId = req.params.id;
    const customerId = req.user._id;

    // Check if homemaker exists and is actually a homemaker
    const homemakerObj = await User.findById(homemakerId);
    if (!homemakerObj || homemakerObj.role !== 'homemaker') {
      return res.status(404).json({ message: 'Homemaker not found' });
    }

    // Prevent duplicate follow
    const alreadyFollowed = await Follow.findOne({ customer: customerId, homemaker: homemakerId });
    if (alreadyFollowed) {
      return res.status(400).json({ message: 'Already following this homemaker' });
    }

    await Follow.create({ customer: customerId, homemaker: homemakerId });
    res.json({ message: 'Successfully followed homemaker' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfollow a homemaker
// @route   POST /api/homemakers/:id/unfollow
// @access  Private/Customer
export const unfollowHomemaker = async (req, res) => {
  try {
    const homemakerId = req.params.id;
    const customerId = req.user._id;

    const follow = await Follow.findOneAndDelete({ customer: customerId, homemaker: homemakerId });
    if (!follow) {
      return res.status(400).json({ message: 'You are not following this homemaker' });
    }

    res.json({ message: 'Successfully unfollowed homemaker' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check follow status
// @route   GET /api/homemakers/:id/follow-status
// @access  Private/Customer
export const checkFollowStatus = async (req, res) => {
  try {
    const follow = await Follow.findOne({
      customer: req.user._id,
      homemaker: req.params.id,
    });
    res.json({ isFollowing: !!follow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all homemakers
// @route   GET /api/homemakers
// @access  Public
export const getHomemakers = async (req, res) => {
  try {
    const homemakers = await User.find({ role: 'homemaker', isBanned: false })
      .select('name avatar bio specialty rating ratingCount address latitude longitude serviceRadius');
    res.json(homemakers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
