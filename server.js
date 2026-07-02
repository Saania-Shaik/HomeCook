import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Config
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import homemakerRoutes from './routes/homemakerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { startStaleDishChecker } from './jobs/checkStaleDishes.js';

// Models for seeding
import User from './models/User.js';

dotenv.config();

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with client domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const activeUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Register client user ID
  socket.on('register', (userId) => {
    if (userId) {
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} registered to socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`User ${userId} unregistered`);
        break;
      }
    }
  });
});

// Set sockets in app state to be accessed by controllers
app.set('io', io);
app.set('activeUsers', activeUsers);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (uploaded files)
const __dirname = path.resolve();
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/homemakers', homemakerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('HomeCook Connect API is running...');
});

// Seed default Admin user if not exists
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('Seeding default Admin user...');
      await User.create({
        name: 'System Admin',
        email: 'admin@homecook.com',
        password: 'admin123', // Will be hashed via pre-save hook
        role: 'admin',
        bio: 'Platform Manager',
      });
      console.log('Default Admin user created successfully (Email: admin@homecook.com, Password: admin123)');
    }
  } catch (error) {
    console.error(`Admin seeding failed: ${error.message}`);
  }
};
seedAdmin();

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  startStaleDishChecker(app);
});
