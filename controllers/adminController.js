import User from '../models/User.js';
import Order from '../models/Order.js';
import Dish from '../models/Dish.js';

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalHomemakers = await User.countDocuments({ role: 'homemaker' });
    const totalOrders = await Order.countDocuments({});
    
    // Total revenue
    const orders = await Order.find({ status: 'delivered' });
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Top active dishes
    const totalDishes = await Dish.countDocuments({});

    res.json({
      totalUsers,
      totalCustomers,
      totalHomemakers,
      totalOrders,
      totalSales,
      totalDishes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user ban status
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
export const toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin user' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      message: `User is now ${user.isBanned ? 'banned' : 'active'}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
