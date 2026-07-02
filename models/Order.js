import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    homemaker: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Dish',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'preparing', 'ready', 'picked', 'delivered'],
      default: 'pending',
    },
    type: {
      type: String,
      required: true,
      enum: ['standard', 'request'],
      default: 'standard',
    },
    specialRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpecialRequest',
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
