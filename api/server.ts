import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { connectDB } from '../server/db.js';
import User from '../server/models/User.js';
import authRouter from '../server/routes/auth.js';
import logsRouter from '../server/routes/logs.js';
import habitsRouter from '../server/routes/habits.js';

const app = express();
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
    callbackURL: `${process.env.API_URL || ''}/auth/google/callback`,
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
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Connect DB once (cached for serverless warm starts) ─────────────────────
let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  app(req, res);
}
