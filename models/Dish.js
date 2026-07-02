import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    availableDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    homemaker: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'sold_out'],
      default: 'available',
    },
    isCustomListing: {
      type: Boolean,
      default: false,
    },
    staleNotificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Dish = mongoose.model('Dish', dishSchema);

export default Dish;
