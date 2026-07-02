import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// A customer can only follow a homemaker once
followSchema.index({ customer: 1, homemaker: 1 }, { unique: true });

const Follow = mongoose.model('Follow', followSchema);

export default Follow;
