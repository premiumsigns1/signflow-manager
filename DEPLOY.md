# SignFlow Manager - Deployment Guide

## Quick Deploy Options

### Option 1: Render.com (Recommended - Free)

1. **Push code to GitHub**
   ```bash
   cd /workspace/signflow-manager
   git init
   git add .
   git commit -m "SignFlow Manager"
   # Create a new repository on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/signflow-manager.git
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Build Command**: `npm install && cd server && npm install && npx prisma generate && npm run build && cd ../client && npm install && npm run build`
     - **Start Command**: `cd server && npm start`
   - Add environment variable:
     - `JWT_SECRET`: Generate a random string
   - Create a PostgreSQL database (Render offers free tier)
   - Click "Deploy"

3. **Update Client API URL**
   - After deployment, edit `client/src/lib/api.ts`
   - Change `const API_BASE = '/api'` to your backend URL
   - Redeploy

---

### Option 2: Railway (Also Free)

1. **Push code to GitHub** (same as above)

2. **Deploy to Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect Node.js and deploy

3. **Add PostgreSQL**
   - In your project, click "New +" → "Database" → "PostgreSQL"
   - Copy the connection string

4. **Set Environment Variables**
   - Add `DATABASE_URL` with your PostgreSQL connection string
   - Add `JWT_SECRET` with a random string

---

### Option 3: Fly.io (Good for Docker)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. `fly launch` in your project directory
3. Follow the prompts
4. Add PostgreSQL: `fly postgres create`
5. Connect it to your app

---

## Local Development (Already Working)

If you just want to run it locally:

```bash
# Terminal 1 - Start backend
cd /workspace/signflow-manager/server
npm run dev

# Terminal 2 - Start frontend  
cd /workspace/signflow-manager/client
npm run dev
```

Then open http://localhost:5173

---

## Environment Variables Needed

For production, set these:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | Secret for JWT tokens | `your-random-secret-key` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |

---

## Current Status

- ✅ Frontend deployed: https://v9jhr86tssvv.space.minimax.io
- ⏳ Backend: Needs to be deployed to a Node.js host

The frontend is currently showing the login page but can't connect to a backend. Deploy the backend using one of the options above to make it fully functional!
