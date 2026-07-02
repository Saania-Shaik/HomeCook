import mongoose from 'mongoose';

const specialRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    dishName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    neededDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'fulfilled'],
      default: 'pending',
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dishCreated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dish',
      default: null,
    },
    agreedPrice: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SpecialRequest = mongoose.model('SpecialRequest', specialRequestSchema);

export default SpecialRequest;
