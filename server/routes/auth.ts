import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, displayName, password } = req.body;

    if (!email || !displayName || !password) {
      return res.status(400).json({ error: 'Email, display name, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), displayName, passwordHash });

    const token = jwt.sign(
      { id: user._id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ token, user: { id: user._id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /auth/me — validate JWT and return user info
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
