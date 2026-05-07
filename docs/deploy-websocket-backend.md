# Deploying Three Kingdoms Chess WebSocket Backend

This document provides instructions for deploying the standalone Socket.io backend server.

## Local Execution

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm run server
   ```
   The backend will start at `http://localhost:8787`.
3. Verify health:
   Open `http://localhost:8787/health` in your browser.

## Deployment to Render

1. Create a **New Web Service** on Render.
2. Link your repository.
3. Configure settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
4. Add Environment Variables:
   - `CORS_ORIGIN`: `https://3-k-chess.vercel.app`
   - `PORT`: `8787` (Render will override this, but good to have)

## Deployment to Railway

1. Create a **New Project** from GitHub.
2. Railway will detect the `package.json`.
3. Set the **Start Command** to `npm run server`.
4. Add Environment Variables:
   - `CORS_ORIGIN`: `https://3-k-chess.vercel.app`

## Frontend Configuration

On your Vercel (or other frontend) deployment, set the following environment variable:
`VITE_WS_URL`: `https://your-backend-url.com`

## Limitations & Scope

- **In-memory storage:** All room data is stored in memory. Rooms will be reset if the server restarts or sleeps (on free tiers).
- **No Authentication:** Identity is derived from Socket IDs.
- **Prototype Mode:** This is a v1 implementation for testing online tactical maneuvers.
- **Rules:** Chess rules are currently validated on the client side. Server-side validation is planned for Backend v2.
