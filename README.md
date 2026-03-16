# GreenDay Dashboard

A performance tracking calendar for traders and high-performers. Track daily P&L, habits, discipline scores, and strategy playbooks — all in one clean dashboard.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: Google OAuth 2.0 + JWT
- **Deployment**: Vercel (frontend + serverless API)

## Local Development

1. Clone the repo and install dependencies:
   ```sh
   git clone https://github.com/ronadasakalesha/GreenDayDashboard.git
   cd GreenDayDashboard
   npm install
   ```

2. Copy the env file and fill in your values:
   ```sh
   copy .env.example .env
   ```

   Required variables:
   | Variable | Description |
   |----------|-------------|
   | `MONGODB_URI` | MongoDB Atlas connection string or `mongodb://localhost:27017/greenday` |
   | `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret |
   | `JWT_SECRET` | Long random string for signing JWTs |
   | `APP_URL` | Frontend URL (e.g. `http://localhost:3000`) |
   | `API_URL` | Backend URL (e.g. `http://localhost:4000`) — optional for local |

3. Start the backend (Express on port 4000):
   ```sh
   npm run server
   ```

4. Start the frontend (Vite on port 3000):
   ```sh
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

1. Push this repo to GitHub.
2. Import the repo into [Vercel](https://vercel.com).
3. Set the following **Environment Variables** in the Vercel project settings:
   - `MONGODB_URI`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `JWT_SECRET`
   - `APP_URL` → your Vercel production URL (e.g. `https://greenday-dashboard.vercel.app`)
   - `API_URL` → same as `APP_URL` (the serverless functions share the same domain)
4. In Google Cloud Console, add your Vercel production URL to the authorized redirect URIs:
   ```
   https://greenday-dashboard.vercel.app/auth/google/callback
   ```
5. Deploy!

## Features

- 📅 **Performance Calendar** — color-coded daily P&L view
- 📈 **Equity Curve** — cumulative performance chart with range selector
- 🧠 **Strategy Playbooks** — track which strategies drive wins
- 📊 **Analytics** — P&L by strategy, win rate breakdowns
- 🔒 **Google Auth** — secure login, per-user data isolation
- 📤 **CSV Export** — download your full trading journal
