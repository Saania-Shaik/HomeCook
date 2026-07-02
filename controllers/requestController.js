import SpecialRequest from '../models/SpecialRequest.js';
import Dish from '../models/Dish.js';
import Notification from '../models/Notification.js';

// @desc    Create a special request (by Customer)
// @route   POST /api/requests
// @access  Private/Customer
export const createSpecialRequest = async (req, res) => {
  const { dishName, quantity, neededDate } = req.body;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(neededDate) < today) {
      return res.status(400).json({ message: 'Needed date cannot be in the past.' });
    }

    const request = await SpecialRequest.create({
      customer: req.user._id,
      dishName,
      quantity: Number(quantity),
      neededDate: new Date(neededDate),
      status: 'pending',
    });

    // Notify homemakers in real-time if we want, but storing notifications for everyone can be heavy.
    // Instead, homemakers will see all pending requests on their dashboard,
    // and we can optionally broadcast a general socket event 'new_custom_request'.
    const io = req.app.get('io');
    if (io) {
      io.emit('new_custom_request', request);
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get custom requests (Customers see their own, Homemakers see all pending + their accepted ones)
// @route   GET /api/requests
// @access  Private
export const getSpecialRequests = async (req, res) => {
  try {
    let requests;

    if (req.user.role === 'customer') {
      requests = await SpecialRequest.find({ customer: req.user._id })
        .populate('acceptedBy', 'name specialty avatar rating address latitude longitude serviceRadius')
        .populate('dishCreated', 'name price image quantity status isCustomListing')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'homemaker') {
      // Homemakers see all pending requests AND requests they accepted
      requests = await SpecialRequest.find({
        $or: [
          { status: 'pending' },
          { acceptedBy: req.user._id }
        ]
      })
        .populate('customer', 'name avatar address latitude longitude')
        .populate('dishCreated', 'name price image quantity status isCustomListing')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'admin') {
      requests = await SpecialRequest.find({})
        .populate('customer', 'name')
        .populate('acceptedBy', 'name')
        .sort({ createdAt: -1 });
    }

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a special request (by Homemaker)
// @route   PUT /api/requests/:id/accept
// @access  Private/Homemaker
export const acceptSpecialRequest = async (req, res) => {
  try {
    const request = await SpecialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been accepted or fulfilled' });
    }

    request.status = 'accepted';
    request.acceptedBy = req.user._id;
    await request.save();

    // Notify Customer
    const notificationText = `Chef ${req.user.name} has accepted your request for "${request.dishName}". They will list the dish soon!`;
    const notification = await Notification.create({
      user: request.customer,
      text: notificationText,
      type: 'request_accepted',
    });

    // Send socket event
    const io = req.app.get('io');
    const activeUsers = req.app.get('activeUsers');
    const customerId = request.customer.toString();

    if (io) {
      // Notify other homemakers that this request is no longer available
      io.emit('custom_request_taken', { requestId: request._id });

      // Notify customer
      if (activeUsers && activeUsers.has(customerId)) {
        const socketId = activeUsers.get(customerId);
        io.to(socketId).emit('notification', {
          _id: notification._id,
          text: notification.text,
          type: notification.type,
          read: false,
          createdAt: notification.createdAt,
        });
        io.to(socketId).emit('request_accepted_update', request);
      }
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create dish for accepted request (by Homemaker)
// @route   POST /api/requests/:id/dish
// @access  Private/Homemaker
export const createDishForRequest = async (req, res) => {
  const { price, description } = req.body;

  try {
    const request = await SpecialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Request is not accepted yet or already completed' });
    }

    if (request.acceptedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized. You are not the assignee for this request.' });
    }

    // Create the dish — price is the total for all servings, not per-serving
    const dish = await Dish.create({
      name: request.dishName,
      price: Number(price),
      quantity: request.quantity,
      availableDate: request.neededDate,
      description: description || `Custom prepared meal for ${request.dishName} request.`,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      homemaker: req.user._id,
      status: 'available',
      isCustomListing: true,
    });

    // Link the dish to the request and store agreed total price
    request.dishCreated = dish._id;
    request.agreedPrice = Number(price);
    await request.save();

    // Notify Customer to confirm and purchase the dish
    const notificationText = `Chef ${req.user.name} has posted the custom dish for your request: "${request.dishName}". Confirm your order now!`;
    const notification = await Notification.create({
      user: request.customer,
      text: notificationText,
      type: 'new_dish',
    });

    const io = req.app.get('io');
    const activeUsers = req.app.get('activeUsers');
    const customerId = request.customer.toString();

    if (io && activeUsers && activeUsers.has(customerId)) {
      const socketId = activeUsers.get(customerId);
      io.to(socketId).emit('notification', {
        _id: notification._id,
        text: notification.text,
        type: notification.type,
        read: false,
        createdAt: notification.createdAt,
      });
      io.to(socketId).emit('request_dish_created', { request, dish });
    }

    res.status(201).json({ request, dish });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
