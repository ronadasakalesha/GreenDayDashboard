import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { connectDB } from './db.js';
import User from './models/User.js';
import authRouter from './routes/auth.js';
import logsRouter from './routes/logs.js';
import habitsRouter from './routes/habits.js';

const app = express();
const PORT = process.env.PORT || 4000;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: APP_URL,
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// ─── Passport Google Strategy ─────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `/auth/google/callback`,
    proxy: true,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          displayName: profile.displayName,
          photoURL: profile.photos?.[0]?.value,
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }
));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/api/logs', logsRouter);
app.use('/api/habits', habitsRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Google OAuth callback: http://localhost:${PORT}/auth/google/callback`);
  });
});
