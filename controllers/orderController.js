import Order from '../models/Order.js';
import Dish from '../models/Dish.js';
import Notification from '../models/Notification.js';
import SpecialRequest from '../models/SpecialRequest.js';

const resolveIsCustomOrder = async (dish, type, specialRequestId) => {
  if (type === 'request' || dish.isCustomListing) {
    return true;
  }
  if (specialRequestId) {
    return true;
  }
  const linkedRequest = await SpecialRequest.findOne({ dishCreated: dish._id });
  return !!linkedRequest;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
export const createOrder = async (req, res) => {
  const { dishId, quantity, type, specialRequestId } = req.body;

  try {
    const dish = await Dish.findById(dishId);

    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dishDate = new Date(dish.availableDate);
    dishDate.setHours(0, 0, 0, 0);
    if (dishDate < today) {
      return res.status(400).json({ message: 'Cannot order dishes from past days.' });
    }

    if (dish.quantity < quantity) {
      return res.status(400).json({ message: `Insufficient quantity. Only ${dish.quantity} left.` });
    }

    const isCustomOrder = await resolveIsCustomOrder(dish, type, specialRequestId);

    if (isCustomOrder && quantity !== dish.quantity) {
      return res.status(400).json({ message: 'Custom listings must be ordered in full at the agreed total price.' });
    }

    // Deduct quantity
    dish.quantity -= quantity;
    if (dish.quantity === 0) {
      dish.status = 'sold_out';
    }
    await dish.save();

    // For standard orders: price is per-serving, so multiply by quantity.
    // For custom/request orders: the chef sets a single total price for all servings,
    // so dish.price is already the full agreed amount — do NOT multiply again.
    const totalPrice = isCustomOrder ? dish.price : dish.price * quantity;

    const order = await Order.create({
      customer: req.user._id,
      homemaker: dish.homemaker,
      dish: dishId,
      quantity,
      totalPrice,
      status: 'pending',
      type: isCustomOrder ? 'request' : 'standard',
      specialRequest: specialRequestId || null,
    });

    // If it is a custom request order, mark the request as fulfilled
    if (specialRequestId) {
      await SpecialRequest.findByIdAndUpdate(specialRequestId, {
        status: 'fulfilled',
        dishCreated: dishId,
      });
    }

    // Notify Homemaker
    const notificationText = `New order received from ${req.user.name}: ${quantity}x "${dish.name}" (Total: ₹${totalPrice}).`;
    const notification = await Notification.create({
      user: dish.homemaker,
      text: notificationText,
      type: 'order_status',
    });

    // Send socket event
    const io = req.app.get('io');
    const activeUsers = req.app.get('activeUsers');
    const homemakerId = dish.homemaker.toString();

    if (io && activeUsers && activeUsers.has(homemakerId)) {
      const socketId = activeUsers.get(homemakerId);
      io.to(socketId).emit('notification', {
        _id: notification._id,
        text: notification.text,
        type: notification.type,
        read: false,
        createdAt: notification.createdAt,
      });
      io.to(socketId).emit('new_order', order); // Also notify order dashboard
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user orders (customers see their own, homemakers see orders placed to them)
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    let orders;

    if (req.user.role === 'customer') {
      orders = await Order.find({ customer: req.user._id })
        .populate('dish', 'name image price')
        .populate('homemaker', 'name specialty avatar')
        .populate('deliveryPartner', 'name email avatar')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'homemaker') {
      orders = await Order.find({ homemaker: req.user._id })
        .populate('dish', 'name image price')
        .populate('customer', 'name avatar address latitude longitude')
        .populate('deliveryPartner', 'name email avatar')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'delivery') {
      orders = await Order.find({
        $or: [
          { status: 'ready' },
          { deliveryPartner: req.user._id }
        ]
      })
        .populate('dish', 'name image price')
        .populate('customer', 'name avatar address latitude longitude')
        .populate('homemaker', 'name avatar address latitude longitude')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'admin') {
      orders = await Order.find({})
        .populate('dish', 'name price')
        .populate('customer', 'name')
        .populate('homemaker', 'name')
        .populate('deliveryPartner', 'name')
        .sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('dish', 'name image price description')
      .populate('customer', 'name email avatar address latitude longitude')
      .populate('homemaker', 'name email specialty avatar address latitude longitude')
      .populate('deliveryPartner', 'name email avatar');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify authorized user
    const isDeliveryAllowed = req.user.role === 'delivery' && (order.status === 'ready' || (order.deliveryPartner && order.deliveryPartner._id.toString() === req.user._id.toString()));
    if (
      req.user.role !== 'admin' &&
      order.customer._id.toString() !== req.user._id.toString() &&
      order.homemaker._id.toString() !== req.user._id.toString() &&
      !isDeliveryAllowed
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (by Homemaker or Delivery Partner)
// @route   PUT /api/orders/:id/status
// @access  Private/Homemaker/Delivery
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id).populate('dish', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Role-based validation
    if (req.user.role === 'homemaker') {
      // Verify homemaker ownership
      if (order.homemaker.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to manage this order' });
      }
      
      const homemakerStatuses = ['accepted', 'preparing', 'ready'];
      if (!homemakerStatuses.includes(status)) {
        return res.status(400).json({ message: `Homemaker is not authorized to transition order to status: ${status}` });
      }
    } else if (req.user.role === 'delivery') {
      const deliveryStatuses = ['picked', 'delivered'];
      if (!deliveryStatuses.includes(status)) {
        return res.status(400).json({ message: `Delivery partner is not authorized to transition order to status: ${status}` });
      }

      if (status === 'picked') {
        if (order.status !== 'ready') {
          return res.status(400).json({ message: 'Order must be ready for pickup' });
        }
        order.deliveryPartner = req.user._id;
      } else if (status === 'delivered') {
        if (order.status !== 'picked') {
          return res.status(400).json({ message: 'Order must be picked up before it can be marked as delivered' });
        }
        if (order.deliveryPartner && order.deliveryPartner.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Not authorized. You are not the assigned delivery partner for this order.' });
        }
      }
    } else {
      return res.status(403).json({ message: 'Unauthorized role to update status.' });
    }

    order.status = status;
    const updatedOrder = await order.save();
    
    // Fully populate updated order to return
    const fullyPopulatedOrder = await Order.findById(updatedOrder._id)
      .populate('dish', 'name image price')
      .populate('customer', 'name email avatar')
      .populate('homemaker', 'name email specialty avatar')
      .populate('deliveryPartner', 'name email avatar');

    // Notify Customer
    let notificationText = `Your order for "${order.dish.name}" has been updated to "${status.toUpperCase()}".`;
    if (status === 'picked') {
      notificationText = `Your order for "${order.dish.name}" has been picked up by ${req.user.name} and is on the way!`;
    }
    const notification = await Notification.create({
      user: order.customer,
      text: notificationText,
      type: 'order_status',
    });

    // Notify Homemaker if update is made by Delivery Partner
    if (req.user.role === 'delivery') {
      await Notification.create({
        user: order.homemaker,
        text: `Order for "${order.dish.name}" has been marked as "${status.toUpperCase()}" by delivery partner ${req.user.name}.`,
        type: 'order_status',
      });
    }

    // Send socket events
    const io = req.app.get('io');
    const activeUsers = req.app.get('activeUsers');
    const customerId = order.customer.toString();
    const homemakerId = order.homemaker.toString();

    if (io) {
      // Send to customer
      if (activeUsers && activeUsers.has(customerId)) {
        const socketId = activeUsers.get(customerId);
        io.to(socketId).emit('notification', {
          _id: notification._id,
          text: notification.text,
          type: notification.type,
          read: false,
          createdAt: notification.createdAt,
        });
        io.to(socketId).emit('order_update', fullyPopulatedOrder);
      }
      // Send to homemaker
      if (activeUsers && activeUsers.has(homemakerId)) {
        const socketId = activeUsers.get(homemakerId);
        io.to(socketId).emit('order_update', fullyPopulatedOrder);
      }
      // Broadcast to delivery partners when a new order becomes ready or is taken
      if (status === 'ready') {
        io.emit('delivery_ready', fullyPopulatedOrder);
      } else if (status === 'picked') {
        io.emit('delivery_taken', { orderId: order._id });
      }
    }

    res.json(fullyPopulatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
