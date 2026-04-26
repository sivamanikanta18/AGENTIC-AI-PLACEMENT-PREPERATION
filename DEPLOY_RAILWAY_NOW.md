# 🚀 DEPLOY NOW - Railway + Vercel (Free/Cheapest)

**Cost:** $0-5/month (Railway $5 credit + Vercel Free + MongoDB Free)

---

## ⚡ 5-MINUTE QUICK DEPLOY

### Step 1: Push Config (1 min)
```bash
cd c:\Users\Sivam\Desktop\wind\prepsense-ai
git add railway.json vercel.json Procfile
git commit -m "Add Railway + Vercel config"
git push origin main
```

---

### Step 2: Deploy Backend on Railway (2 min)

1. **Go to:** https://railway.app
2. **Login with GitHub**
3. Click "**New Project**"
4. Select "**Deploy from GitHub repo**"
5. Choose your repo

**Add Environment Variables:**
6. Click "**Variables**" tab
7. Add each one:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=(run: openssl rand -base64 64)
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_key
AI_PROVIDER=groq
CLIENT_URL=(leave blank for now)
ALLOWED_ORIGINS=(leave blank for now)
```

8. Railway auto-deploys
9. **Copy your backend URL:**
   - `https://prepsense-ai-backend.up.railway.app`

---

### Step 3: Deploy Frontend on Vercel (2 min)

1. **Go to:** https://vercel.com
2. **Login with GitHub**
3. Click "**Add New...**" → "**Project**"
4. Import your GitHub repo

**Configure:**
5. **Framework:** Vite
6. **Root Directory:** `frontend`
7. **Build Command:** `npm run build`
8. **Output:** `dist`

**Add Environment Variable:**
9. `VITE_API_URL=https://prepsense-ai-backend.up.railway.app/api`
   (Use YOUR Railway URL)

10. Click "**Deploy**"
11. **Copy your frontend URL:**
    - `https://prepsense-ai.vercel.app`

---

### Step 4: Connect Them (30 sec)

1. Go back to **Railway** dashboard
2. Click "**Variables**"
3. Update:

```
CLIENT_URL=https://prepsense-ai.vercel.app
ALLOWED_ORIGINS=https://prepsense-ai.vercel.app
```

(Use YOUR Vercel URL)

4. Auto-redeploys

---

### Step 5: Test (1 min)

Open: `https://prepsense-ai.vercel.app`

- [ ] Register works
- [ ] Login works  
- [ ] Resume upload works
- [ ] AI analysis works

---

## ✅ DONE!

**Your URLs:**
- Frontend: `https://prepsense-ai.vercel.app` (FREE)
- Backend: `https://prepsense-ai-backend.up.railway.app` ($0-5)

**Total Cost:** $0-5/month

---

## 📊 Monitor Usage

Go to https://railway.app → your project → "**Usage**"

- Under $5 = FREE ✅
- Over $5 = Pay $5/month (still cheap!)

---

## 🐛 Issues?

| Problem | Fix |
|---------|-----|
| Build fails | Delete `package-lock.json`, push again |
| CORS error | Check `CLIENT_URL` matches Vercel URL |
| MongoDB error | Check IP whitelist `0.0.0.0/0` |
| AI not working | Check `GROQ_API_KEY` is valid |

**Full guide:** See `RAILWAY_VERCEL_DEPLOY.md`

---

## 🎉 LIVE IN 5 MINUTES!

Go deploy now! 🚀
