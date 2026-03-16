import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${APP_URL}/login-failed` }),
  (req, res) => {
    const user = req.user as InstanceType<typeof User>;
    const token = jwt.sign(
      {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to frontend with token in URL hash — frontend saves to localStorage
    res.redirect(`${APP_URL}/#token=${token}`);
  }
);

// Get current user from JWT
router.get('/me', (req, res) => {
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
