import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import Order from './models/orderModel.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Check for required env variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ Missing environment variables. Ensure MONGO_URI and JWT_SECRET are set in .env");
  process.exit(1);
}

// Paths for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // <-- frontend origin if you're using Vite/React; adjust if needed
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema & Model
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema, 'users');

// Frontend Path
const frontendPath = path.join(__dirname, 'frontend');

// 🔐 Protected route middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.redirect('/');
  }
}

// 🌐 Routes

// Serve login page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'a-login.html'));
});

// Serve protected index page
app.get('/index.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { fullName, name, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { name }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({ fullName, name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false });

    res.status(200).json({ message: 'Login successful', token, redirectUrl: '/index.html' });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Order
app.post('/api/orders', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { cart, totalAmount } = req.body;
    if (!cart || cart.length === 0 || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid cart details' });
    }

    const newOrder = new Order({ userId, items: cart, totalAmount });
    await newOrder.save();

    res.status(201).json({ message: 'Order placed successfully' });
  } catch (error) {
    console.error('❌ Order Placement Error:', error);
    res.status(403).json({ error: 'Invalid token. Please log in again.' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// ⚙️ Serve static files AFTER custom routes
app.use(express.static(frontendPath));

// 404
app.use((req, res) => {
  res.status(404).send('404 - Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
