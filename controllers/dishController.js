import Dish from '../models/Dish.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Create new dish
// @route   POST /api/dishes
// @access  Private/Homemaker
export const createDish = async (req, res) => {
  const { name, price, quantity, availableDate, description } = req.body;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(availableDate) < today) {
      return res.status(400).json({ message: 'Available date cannot be in the past.' });
    }

    const dish = new Dish({
      name,
      price: Number(price),
      quantity: Number(quantity),
      availableDate: new Date(availableDate),
      description,
      homemaker: req.user._id,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      status: Number(quantity) > 0 ? 'available' : 'sold_out',
    });

    const createdDish = await dish.save();

    // Find followers of this homemaker
    const followers = await Follow.find({ homemaker: req.user._id });
    
    // Setup real-time notify
    const io = req.app.get('io');
    const activeUsers = req.app.get('activeUsers');

    const notificationText = `Chef ${req.user.name} posted a new dish: "${name}" (${quantity} servings available for ${new Date(availableDate).toLocaleDateString()})!`;

    // Process notifications
    for (const follow of followers) {
      const followerId = follow.customer.toString();
      
      // Create DB notification
      const notification = await Notification.create({
        user: followerId,
        text: notificationText,
        type: 'new_dish',
      });

      // Send socket event
      if (io && activeUsers && activeUsers.has(followerId)) {
        const socketId = activeUsers.get(followerId);
        io.to(socketId).emit('notification', {
          _id: notification._id,
          text: notification.text,
          type: notification.type,
          read: false,
          createdAt: notification.createdAt,
        });
      }
    }

    res.status(201).json(createdDish);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all dishes
// @route   GET /api/dishes
// @access  Public
export const getDishes = async (req, res) => {
  try {
    const query = { status: 'available' };
    
    // Filter by homemaker
    if (req.query.homemaker) {
      query.homemaker = req.query.homemaker;
      // When viewing specific homemaker profile, also show sold out dishes
      delete query.status; 
    }

    // Filter by date (e.g. today, tomorrow)
    if (req.query.date) {
      const searchDate = new Date(req.query.date);
      const startOfDay = new Date(searchDate.setHours(0,0,0,0));
      const endOfDay = new Date(searchDate.setHours(23,59,59,999));
      query.availableDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const dishes = await Dish.find(query)
      .populate('homemaker', 'name specialty rating avatar address pincode')
      .sort({ availableDate: 1 });

    res.json(dishes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single dish by ID
// @route   GET /api/dishes/:id
// @access  Public
export const getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id).populate('homemaker', 'name specialty rating avatar bio address pincode');

    if (dish) {
      res.json(dish);
    } else {
      res.status(404).json({ message: 'Dish not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a dish
// @route   PUT /api/dishes/:id
// @access  Private/Homemaker
export const updateDish = async (req, res) => {
  const { name, price, quantity, availableDate, description, status } = req.body;

  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Check ownership
    if (dish.homemaker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this dish' });
    }

    dish.name = name || dish.name;
    dish.price = price !== undefined ? Number(price) : dish.price;
    dish.quantity = quantity !== undefined ? Number(quantity) : dish.quantity;
    if (availableDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(availableDate) < today) {
        return res.status(400).json({ message: 'Available date cannot be in the past.' });
      }
      dish.availableDate = availableDate;
    }
    dish.description = description !== undefined ? description : dish.description;
    
    if (quantity !== undefined) {
      dish.status = Number(quantity) > 0 ? (status || 'available') : 'sold_out';
    } else {
      dish.status = status || dish.status;
    }

    if (req.file) {
      dish.image = `/uploads/${req.file.filename}`;
    }

    const updatedDish = await dish.save();
    res.json(updatedDish);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a dish
// @route   DELETE /api/dishes/:id
// @access  Private/Homemaker
export const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Check ownership
    if (dish.homemaker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this dish' });
    }

    await dish.deleteOne();
    res.json({ message: 'Dish removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
