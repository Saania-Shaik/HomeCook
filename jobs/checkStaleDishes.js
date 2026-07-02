import Dish from '../models/Dish.js';
import Notification from '../models/Notification.js';

const STALE_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

const notifyHomemaker = (app, homemakerId, notification) => {
  const io = app.get('io');
  const activeUsers = app.get('activeUsers');

  if (io && activeUsers && activeUsers.has(homemakerId)) {
    const socketId = activeUsers.get(homemakerId);
    io.to(socketId).emit('notification', {
      _id: notification._id,
      text: notification.text,
      type: notification.type,
      read: false,
      createdAt: notification.createdAt,
    });
  }
};

export const checkStaleDishes = async (app) => {
  try {
    const cutoff = new Date(Date.now() - STALE_MS);

    const staleDishes = await Dish.find({
      createdAt: { $lte: cutoff },
      staleNotificationSent: false,
      status: 'available',
    });

    for (const dish of staleDishes) {
      const notificationText = `It has been 24 hours since "${dish.name}" was added — please remove it`;
      const notification = await Notification.create({
        user: dish.homemaker,
        text: notificationText,
        type: 'dish_stale',
      });

      dish.staleNotificationSent = true;
      await dish.save();

      notifyHomemaker(app, dish.homemaker.toString(), notification);
    }
  } catch (error) {
    console.error(`Stale dish check failed: ${error.message}`);
  }
};

export const startStaleDishChecker = (app) => {
  checkStaleDishes(app);
  setInterval(() => checkStaleDishes(app), CHECK_INTERVAL_MS);
};
