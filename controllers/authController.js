import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, role, bio, specialty, address, latitude, longitude, serviceRadius, pincode } = req.body;

  try {
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userData = {
      name,
      email,
      password,
      role,
      bio: role === 'homemaker' ? bio : '',
      specialty: role === 'homemaker' ? specialty : '',
      address: address || '',
      pincode: pincode || '',
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      serviceRadius: serviceRadius ? Number(serviceRadius) : 10,
    };

    if (req.file) {
      userData.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        specialty: user.specialty,
        rating: user.rating,
        avatar: user.avatar,
        address: user.address,
        pincode: user.pincode,
        latitude: user.latitude,
        longitude: user.longitude,
        serviceRadius: user.serviceRadius,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This account has been banned by an admin' });
    }

    if (await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        specialty: user.specialty,
        rating: user.rating,
        avatar: user.avatar,
        address: user.address,
        pincode: user.pincode,
        latitude: user.latitude,
        longitude: user.longitude,
        serviceRadius: user.serviceRadius,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        specialty: user.specialty,
        rating: user.rating,
        avatar: user.avatar,
        address: user.address,
        pincode: user.pincode,
        latitude: user.latitude,
        longitude: user.longitude,
        serviceRadius: user.serviceRadius,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Validate email uniqueness if email is changed
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already in use by another user' });
        }
        user.email = req.body.email;
      }

      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.specialty = req.body.specialty !== undefined ? req.body.specialty : user.specialty;
      user.address = req.body.address !== undefined ? req.body.address : user.address;
      user.pincode = req.body.pincode !== undefined ? req.body.pincode : user.pincode;
      user.latitude = req.body.latitude !== undefined ? Number(req.body.latitude) : user.latitude;
      user.longitude = req.body.longitude !== undefined ? Number(req.body.longitude) : user.longitude;
      user.serviceRadius = req.body.serviceRadius !== undefined ? Number(req.body.serviceRadius) : user.serviceRadius;
      
      if (req.file) {
        user.avatar = `/uploads/${req.file.filename}`;
      }

      if (req.body.password) {
        const passwordError = validatePasswordStrength(req.body.password);
        if (passwordError) {
          return res.status(400).json({ message: passwordError });
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        specialty: updatedUser.specialty,
        rating: updatedUser.rating,
        avatar: updatedUser.avatar,
        address: updatedUser.address,
        pincode: updatedUser.pincode,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        serviceRadius: updatedUser.serviceRadius,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
