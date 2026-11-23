
import express from 'express';
import mongoose from 'mongoose';
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

// Check environment variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error('Missing MONGO_URI or JWT_SECRET environment variable');
    process.exit(1);
}

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, 'frontend');

// Middleware
app.use(express.json());
app.use(cookieParser());

// Cookie settings for deployed HTTPS website
const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
};

// User Schema
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

const User = mongoose.model('User', userSchema, 'users');

// Authentication middleware
function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.redirect('/');
    }
}

// Login page
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'a-login.html'));
});

// Protected homepage
app.get('/index.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Signup
app.post('/signup', async (req, res) => {
    try {
        const { fullName, name, email, password } = req.body;

        if (!fullName || !name || !email || !password) {
            return res.status(400).json({
                message: 'Please fill in all fields'
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email.trim().toLowerCase() },
                { name: name.trim() }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        const newUser = new User({
            fullName: fullName.trim(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password
        });

        await newUser.save();

        console.log('New user registered:', newUser.email);

        return res.status(201).json({
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('Signup error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        return res.status(500).json({
            message: 'Unable to create account. Please try again.'
        });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        const user = await User.findOne({ name });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, cookieOptions);

        return res.status(200).json({
            message: 'Login successful',
            redirectUrl: '/index.html'
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            message: 'Login failed. Please try again.'
        });
    }
});

// Place order
app.post('/api/orders', async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                error: 'Please log in first'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { cart, totalAmount } = req.body;

        if (!Array.isArray(cart) || cart.length === 0 || !totalAmount || totalAmount <= 0) {
            return res.status(400).json({
                error: 'Invalid cart details'
            });
        }

        const newOrder = new Order({
            userId,
            items: cart,
            totalAmount
        });

        await newOrder.save();

        return res.status(201).json({
            message: 'Order placed successfully'
        });

    } catch (error) {
        console.error('Order placement error:', error);

        return res.status(403).json({
            error: 'Unable to place order. Please log in again.'
        });
    }
});

// Logout
app.post('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);

    return res.status(200).json({
        message: 'Logged out successfully'
    });
});

// Serve frontend static files
app.use(express.static(frontendPath));

// 404 handler
app.use((req, res) => {
    res.status(404).send('404 - Not Found');
});

// Connect database and start server
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB Connected');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

startServer();
