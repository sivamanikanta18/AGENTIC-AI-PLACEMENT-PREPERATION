# 🚀 Deploy on Railway + Vercel (Free/Cheapest Setup)

**Architecture:**
- **Backend:** Railway ($5 free credit/month)
- **Frontend:** Vercel (FREE)
- **Database:** MongoDB Atlas (FREE)
- **Total Cost:** $0-5/month

---

## 📦 STEP 1: Push Configuration to GitHub

**Run in terminal:**

```bash
cd c:\Users\Sivam\Desktop\wind\prepsense-ai

git add railway.json vercel.json Procfile
git commit -m "Add Railway + Vercel deployment config"
git push origin main
```

---

## 🚂 STEP 2: Deploy Backend on Railway (FREE $5 Credit)

### 2.1 Sign Up
1. Go to https://railway.app
2. Click "Login" → "Continue with GitHub"
3. Authorize Railway to access your repos

### 2.2 Create Project
1. Click "**New Project**"
2. Select "**Deploy from GitHub repo**"
3. Choose your repo: `AGENTIC-AI-PLACEMENT-PREPERATION`
4. Click "**Add Variables**"

### 2.3 Add Environment Variables

Click "**New Variable**" for each:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3000` | Server port (Railway assigns automatically) |
| `JWT_SECRET` | Run: `openssl rand -base64 64` | Strong random string |
| `MONGODB_URI` | Your MongoDB connection string | From Atlas |
| `GROQ_API_KEY` | Your Groq API key | `gsk_...` |
| `AI_PROVIDER` | `groq` | AI service |
| `CLIENT_URL` | Leave blank for now | Will add after Vercel deploy |
| `ALLOWED_ORIGINS` | Leave blank for now | Will add after Vercel deploy |

**Generate JWT_SECRET:**
```bash
# In any terminal:
openssl rand -base64 64
# Copy the output and paste as JWT_SECRET value
```

### 2.4 Deploy
1. Variables will auto-save
2. Railway will auto-detect Node.js and deploy
3. Wait 2-3 minutes for build
4. Look for "🚀 Application started" in logs

### 2.5 Get Backend URL
1. Look at top of dashboard
2. Your URL: `https://prepsense-ai-backend.up.railway.app`
3. **COPY THIS URL** - you'll need it for Vercel

### 2.6 Test Backend
Open in browser:
```
https://prepsense-ai-backend.up.railway.app/api/health
```

Should return: `{"status":"OK","timestamp":"..."}`

---

## ▲ STEP 3: Deploy Frontend on Vercel (FREE)

### 3.1 Sign Up
1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"

### 3.2 Import Project
1. Click "**Add New...**" → "**Project**"
2. Import your GitHub repo
3. Click "**Import**"

### 3.3 Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 3.4 Add Environment Variable

Click "**Environment Variables**" and add:

```
VITE_API_URL=https://prepsense-ai-backend.up.railway.app/api
```

**Use your actual Railway backend URL!**

### 3.5 Deploy
1. Click "**Deploy**"
2. Wait 1-2 minutes
3. Get your frontend URL: `https://prepsense-ai.vercel.app`
4. **COPY THIS URL**

---

## 🔗 STEP 4: Connect Backend to Frontend (CORS)

### Update Railway Backend

1. Go back to https://railway.app
2. Click your backend project
3. Go to "**Variables**" tab
4. Add/Update these variables:

```
CLIENT_URL=https://prepsense-ai.vercel.app
ALLOWED_ORIGINS=https://prepsense-ai.vercel.app
```

Use your **actual Vercel URL**!

5. Railway will auto-redeploy
6. Wait 1 minute for update

---

## ✅ STEP 5: Test Everything

### Test Frontend
Open: `https://prepsense-ai.vercel.app`

Checklist:
- [ ] Page loads
- [ ] Can register new user
- [ ] Can login
- [ ] Can upload resume
- [ ] AI analysis works
- [ ] Can start mock interview
- [ ] Real-time chat works
- [ ] Can generate roadmap
- [ ] Can complete tasks

### Monitor Railway Usage
1. Go to Railway dashboard
2. Click "**Usage**" tab
3. Watch your $5 credit
4. If it stays under $5 = FREE!

**Typical usage:**
- Testing: $0-1/month
- 10-50 users/day: $2-4/month
- 100+ users: $5+ (then paid)

---

## 💰 Cost Monitoring

### Stay Under $5/Month (FREE)

**Tips:**
- Don't have 100s of concurrent users
- Optimize database queries
- Don't run AI analysis on huge resumes repeatedly
- Test during off-peak hours

### If You Exceed $5
You'll get an email. Options:
1. **Upgrade to $5/month plan** (guaranteed)
2. **Switch to Render** ($7/month - more reliable)
3. **Optimize usage** (reduce traffic)

---

## 🔧 Custom Domain (Optional)

### Add Domain to Vercel (Free)
1. Vercel dashboard → Your project
2. "**Settings**" → "**Domains**"
3. Enter your domain: `www.yourdomain.com`
4. Follow DNS instructions

### Add Domain to Railway
1. Railway dashboard → Your project
2. "**Settings**" → "**Domains**"
3. Click "**Generate Domain**" (free Railway subdomain)
4. Or add custom domain (requires paid plan)

---

## 🐛 Troubleshooting

### "Build Failed" on Railway

**Fix:**
```bash
# In your project:
cd backend
rm package-lock.json
rm -rf node_modules
npm install
cd ..
git add .
git commit -m "Fix dependencies"
git push origin main
# Railway will auto-redeploy
```

### "CORS Error" in Browser

**Fix:**
1. Railway dashboard → Variables
2. Check `CLIENT_URL` matches Vercel URL exactly
3. Must include `https://`
4. Redeploy

### "MongoDB Connection Failed"

**Fix:**
1. Check `MONGODB_URI` in Railway variables
2. Go to MongoDB Atlas → Network Access
3. Ensure `0.0.0.0/0` is whitelisted
4. Test locally first

### "WebSocket Connection Failed"

**Fix:**
1. Check Railway logs for errors
2. Ensure backend is running (not crashed)
3. Check `VITE_API_URL` in Vercel is correct
4. Try refreshing page

### Railway Sleeping (Cold Start)

**Issue:** Free tier spins down after inactivity (30 min)
**Fix:**
- First request will be slow (10-20 sec)
- After that, it's fast
- Or upgrade to paid plan (always on)

---

## 📊 Dashboard Links

| Service | Dashboard | Purpose |
|---------|-----------|---------|
| **Railway** | https://railway.app | Backend logs, variables, usage |
| **Vercel** | https://vercel.com/dashboard | Frontend deploys, domains |
| **MongoDB** | https://cloud.mongodb.com | Database monitoring |
| **Groq** | https://console.groq.com/keys | API usage |

---

## 🚀 Quick Commands

```bash
# Update and redeploy
git add .
git commit -m "Update code"
git push origin main
# Both Railway and Vercel will auto-redeploy!

# Check Railway logs
# Go to railway.app → your project → "Logs" tab

# Check Vercel logs
# Go to vercel.com → your project → "Functions" tab
```

---

## ✅ Post-Deploy Checklist

- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Can register/login
- [ ] Resume upload works
- [ ] AI generates analysis
- [ ] Mock interview starts
- [ ] Real-time chat works
- [ ] Roadmap generates
- [ ] Gamification shows XP
- [ ] Mobile responsive works
- [ ] No console errors

---

## 🎉 YOU'RE LIVE!

**Your URLs:**
- Frontend: `https://prepsense-ai.vercel.app`
- Backend: `https://prepsense-ai-backend.up.railway.app`
- API: `https://prepsense-ai-backend.up.railway.app/api`

**Total Cost:** $0-5/month (depends on Railway usage)

**Next Steps:**
1. Share with friends
2. Add to portfolio
3. Monitor Railway usage
4. Collect feedback
5. Scale when needed

---

## 📞 Support

If stuck:
1. Check Railway docs: https://docs.railway.app
2. Check Vercel docs: https://vercel.com/docs
3. Review logs in both dashboards
4. Check this guide again

---

**Happy Deploying! 🚀**
