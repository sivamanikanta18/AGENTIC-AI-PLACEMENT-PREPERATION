# 🚀 Render Deployment Guide - PrepSense AI

Complete step-by-step guide to deploy your PrepSense AI project on Render.

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub account
- [ ] Render account (sign up at render.com)
- [ ] MongoDB Atlas account
- [ ] Groq API key (or OpenAI/Google)
- [ ] Project pushed to GitHub

---

## 🗂️ Files Created for Render

These files have been added to your project:

| File | Purpose |
|------|---------|
| `render.yaml` | Infrastructure as code - defines all services |
| `.env.example` | Template for environment variables |
| `backend/.node-version` | Specifies Node.js version (18.19.0) |
| `frontend/.node-version` | Specifies Node.js version (18.19.0) |
| `RENDER_DEPLOYMENT_GUIDE.md` | This guide |

---

## 🚀 QUICK START (5-Minute Deploy)

### Option A: Deploy with render.yaml (Recommended)

**Step 1: Push render.yaml to GitHub**
```bash
cd c:\Users\Sivam\Desktop\wind\prepsense-ai
git add render.yaml .env.example
 git commit -m "Add Render deployment configuration"
git push origin main
```

**Step 2: Create Blueprint on Render**
1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repository
4. Render will read `render.yaml` and create services automatically
5. Click "Apply"

**Step 3: Set Environment Variables**
After services are created, go to each service dashboard and set:

**Backend Service:**
- `MONGODB_URI` - Your MongoDB connection string
- `GROQ_API_KEY` - Your Groq API key
- `JWT_SECRET` - Generate with: `openssl rand -base64 64`

**Frontend Service:**
- `VITE_API_URL` will be auto-set from backend URL

**Step 4: Deploy**
- Render will automatically deploy both services
- Wait 2-3 minutes for build to complete

---

### Option B: Manual Deploy (More Control)

## 📦 STEP 1: Prepare Your Repository

### 1.1 Ensure render.yaml is committed
```bash
cd c:\Users\Sivam\Desktop\wind\prepsense-ai
git status
# Should show: render.yaml, .env.example

git add .
git commit -m "Prepare for Render deployment - add config files"
git push origin main
```

### 1.2 Verify .gitignore excludes sensitive files
```bash
cat .gitignore
```

Should contain:
```
.env
.env.local
node_modules/
backend/node_modules/
frontend/node_modules/
```

---

## 🗄️ STEP 2: Setup MongoDB Atlas (Database)

### 2.1 Create MongoDB Cluster
1. Go to https://cloud.mongodb.com
2. Sign up / Log in
3. Click "Build a Cluster"
4. Choose **M0 (Free)** shared cluster
5. Select region: **Oregon (us-west-2)** to match Render
6. Click "Create Cluster"

### 2.2 Create Database User
1. In MongoDB Atlas, go to "Database Access"
2. Click "Add New Database User"
3. Authentication: Username & Password
4. Username: `prepsense_user`
5. Password: Generate strong password
6. Click "Add User"

### 2.3 Whitelist IP Addresses
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ This allows Render's dynamic IPs
4. Click "Confirm"

### 2.4 Get Connection String
1. Go to "Database" → "Connect"
2. Click "Connect your application"
3. Copy the connection string:
   ```
   mongodb+srv://prepsense_user:<password>@cluster0.xxxxx.mongodb.net/prepsense_ai?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. **Save this for Step 3!**

---

## 🤖 STEP 3: Get AI API Keys

### Option A: Groq (Recommended - Fast & Cheap)

1. Go to https://console.groq.com/keys
2. Sign up / Log in
3. Click "Create API Key"
4. Name: "PrepSense AI Production"
5. Copy the key: `gsk_...`
6. **Save this for later!**

### Option B: OpenAI (Alternative)

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key

### Option C: Google Gemini (Alternative)

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy the key

---

## 🚀 STEP 4: Deploy Backend (Web Service)

### 4.1 Create Web Service
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | `prepsense-ai-backend` |
   | Region | Oregon (US West) |
   | Runtime | Node |
   | Build Command | `cd backend && npm install` |
   | Start Command | `cd backend && npm start` |
   | Plan | Starter ($7/month) |

5. Click "Create Web Service"

### 4.2 Set Environment Variables
In the service dashboard, go to "Environment" tab:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | |
| `JWT_SECRET` | Generate strong secret | `openssl rand -base64 64` |
| `MONGODB_URI` | Your MongoDB connection | `mongodb+srv://user:pass@cluster.mongodb.net/prepsense_ai` |
| `AI_PROVIDER` | `groq` | |
| `GROQ_API_KEY` | Your Groq key | `gsk_...` |
| `CLIENT_URL` | Will set after frontend deploy | Leave blank for now |
| `ALLOWED_ORIGINS` | Same as above | Leave blank for now |

**How to generate JWT_SECRET:**
```bash
# In terminal (Git Bash, PowerShell, or WSL)
openssl rand -base64 64
# Copy the output and paste as JWT_SECRET
```

### 4.3 Deploy
1. Click "Save Changes"
2. Render will automatically build and deploy
3. Wait 2-3 minutes
4. Look for "Deploy successful" message

### 4.4 Test Backend
1. Copy your backend URL: `https://prepsense-ai-backend.onrender.com`
2. Test health endpoint:
   ```
   https://prepsense-ai-backend.onrender.com/api/health
   ```
3. Should return: `{"status":"OK","timestamp":"..."}`

---

## 🎨 STEP 5: Deploy Frontend (Static Site)

### 5.1 Create Static Site
1. In Render dashboard, click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | `prepsense-ai-frontend` |
   | Region | Oregon (US West) |
   | Build Command | `cd frontend && npm install && npm run build` |
   | Publish Directory | `frontend/dist` |
   | Plan | Free |

4. Click "Create Static Site"

### 5.2 Set Environment Variables
Go to "Environment" tab:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://prepsense-ai-backend.onrender.com/api` |

Replace with your actual backend URL.

### 5.3 Deploy
1. Click "Save Changes"
2. Wait for build (2-3 minutes)
3. Get your frontend URL: `https://prepsense-ai-frontend.onrender.com`

---

## 🔗 STEP 6: Connect Frontend & Backend (CORS)

### 6.1 Update Backend Environment Variables
1. Go to backend service dashboard
2. Click "Environment" tab
3. Update these variables:

   | Key | Value |
   |-----|-------|
   | `CLIENT_URL` | `https://prepsense-ai-frontend.onrender.com` |
   | `ALLOWED_ORIGINS` | `https://prepsense-ai-frontend.onrender.com` |

4. Click "Save Changes"
5. Service will redeploy automatically

### 6.2 Test Full Application
1. Open frontend URL: `https://prepsense-ai-frontend.onrender.com`
2. Try to:
   - Register a new user
   - Login
   - Upload a resume
   - Start a mock interview
   - Check if all features work

---

## 🌐 STEP 7: Custom Domain (Optional)

### 7.1 Buy Domain (Namecheap)
1. Go to https://namecheap.com
2. Search for your domain (e.g., `prepsense-ai.com`)
3. Purchase (~$8-12/year)

### 7.2 Add Domain to Render
**Frontend:**
1. Go to frontend service dashboard
2. Click "Settings"
3. Under "Custom Domain", click "Add Custom Domain"
4. Enter: `www.yourdomain.com`
5. Copy the DNS Target (e.g., `prepsense-ai-frontend.onrender.com`)

**Backend:**
1. Go to backend service dashboard
2. Click "Settings"
3. Add Custom Domain: `api.yourdomain.com`
4. Copy the DNS Target

### 7.3 Configure DNS (Namecheap)
1. Go to Namecheap dashboard
2. Find your domain → "Manage"
3. Go to "Advanced DNS"
4. Add records:

   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | CNAME | www | prepsense-ai-frontend.onrender.com | Automatic |
   | CNAME | api | prepsense-ai-backend.onrender.com | Automatic |
   | A | @ | 76.76.21.21 | Automatic |

5. Save changes
6. Wait 5-30 minutes for DNS propagation

### 7.4 Update Environment Variables
After custom domain works:

**Backend:**
- `CLIENT_URL`: `https://www.yourdomain.com`
- `ALLOWED_ORIGINS`: `https://www.yourdomain.com`

**Frontend:**
- `VITE_API_URL`: `https://api.yourdomain.com/api`

---

## 🔒 STEP 8: SSL/HTTPS (Auto-Enabled)

Render automatically provides SSL certificates for:
- `*.onrender.com` domains
- Custom domains (via Let's Encrypt)

✅ **No action needed** - SSL is automatic!

---

## 📊 STEP 9: Monitoring & Logs

### 9.1 View Logs
- Go to service dashboard
- Click "Logs" tab
- Real-time logs from your application

### 9.2 Set Up Alerts (Optional)
1. Go to service settings
2. Configure:
   - Email notifications for deploy failures
   - Webhook notifications

### 9.3 Add Sentry for Error Tracking (Recommended)
1. Sign up at https://sentry.io (free tier)
2. Create new project: React + Node.js
3. Get DSN keys
4. Add to environment variables:
   - `SENTRY_DSN_FRONTEND`
   - `SENTRY_DSN_BACKEND`

---

## 🔄 STEP 10: Updates & Redeploys

### Automatic Deploys
- Render watches your GitHub repo
- Every push to `main` branch triggers auto-deploy
- No manual action needed!

### Manual Deploy
If needed:
1. Go to service dashboard
2. Click "Manual Deploy"
3. Choose "Deploy latest commit"

### Rollback
If something breaks:
1. Go to service dashboard
2. Click "Manual Deploy"
3. Choose previous commit from dropdown

---

## 💰 COST BREAKDOWN

| Component | Plan | Monthly Cost |
|-----------|------|--------------|
| Backend | Starter | $7 |
| Frontend | Static (Free) | $0 |
| MongoDB | M0 (Free) | $0 |
| Groq API | Pay-per-use | ~$0-5 |
| **TOTAL** | | **~$7-12/month** |

---

## 🐛 TROUBLESHOOTING

### Issue: "Build failed"
**Solution:**
1. Check logs in Render dashboard
2. Common issues:
   - Node version mismatch → Check `.node-version` file
   - Missing dependencies → Delete package-lock.json and push
   - Build command typo → Verify in settings

### Issue: "MongoDB connection failed"
**Solution:**
1. Check `MONGODB_URI` is correct
2. Verify IP whitelist includes `0.0.0.0/0`
3. Check password doesn't have special characters (URL encode if needed)
4. Test locally first:
   ```bash
   cd backend
   MONGODB_URI="your_uri" npm start
   ```

### Issue: "CORS errors in browser"
**Solution:**
1. Check `CLIENT_URL` matches frontend URL exactly
2. Check `ALLOWED_ORIGINS` includes frontend URL
3. Must include `https://` (not just domain)
4. Redeploy backend after changing env vars

### Issue: "WebSocket connection failed"
**Solution:**
1. Socket.io requires Render Web Service (not Static Site)
2. Verify backend is "Starter" plan or higher (WebSocket needs always-on)
3. Check browser console for specific errors
4. Frontend must use backend URL, not WebSocket URL

### Issue: "AI API errors"
**Solution:**
1. Check `AI_PROVIDER` matches your API key
2. Verify API key is active (Groq: https://console.groq.com/keys)
3. Check rate limits (Groq: 20 requests/minute on free tier)
4. Try a different AI provider

### Issue: "JWT token errors"
**Solution:**
1. Check `JWT_SECRET` is set and 32+ characters
2. Generate new secret:
   ```bash
   openssl rand -base64 64
   ```
3. Clear browser localStorage and login again

---

## 📝 POST-DEPLOYMENT CHECKLIST

- [ ] Health check passes: `/api/health`
- [ ] Can register new user
- [ ] Can login
- [ ] Can upload resume
- [ ] AI analysis works
- [ ] Mock interview starts
- [ ] WebSocket chat works (real-time responses)
- [ ] Can generate roadmap
- [ ] Can complete tasks
- [ ] Gamification works (XP, streaks)
- [ ] All pages load correctly
- [ ] Mobile responsive
- [ ] No console errors

---

## 🎉 YOU'RE LIVE!

Your PrepSense AI is now deployed on Render!

**URLs:**
- Frontend: `https://prepsense-ai-frontend.onrender.com`
- Backend: `https://prepsense-ai-backend.onrender.com`
- API: `https://prepsense-ai-backend.onrender.com/api`

**Next Steps:**
1. Share with friends/colleagues
2. Add custom domain (optional)
3. Set up monitoring
4. Collect user feedback
5. Scale when needed

---

## 📞 SUPPORT

If stuck:
1. Check Render docs: https://render.com/docs
2. Check MongoDB docs: https://docs.mongodb.com
3. Check project README.md
4. Review this guide again

---

**Happy Deploying! 🚀**

Last Updated: 2024
Guide Version: 1.0
