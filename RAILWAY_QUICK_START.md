# Railway Deployment - Quick Start

## 🚀 Deploy in 5 Minutes

This is the fastest way to get your Todo App running on Railway.

### Prerequisites

- GitHub account with this repository
- Railway account (sign up at [railway.app](https://railway.app))

### Deployment Steps

#### Step 1: Push to GitHub (if not already done)

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

#### Step 2: Deploy to Railway

1. **Visit [Railway Dashboard](https://railway.app/dashboard)**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Authenticate with GitHub** (if first time)
5. **Select this repository**
6. **Railway auto-detects Next.js and builds**

#### Step 3: Add Persistent Storage (CRITICAL)

**Without this, your database will reset on every deployment!**

1. **In Railway project, click on your service**
2. **Go to "Settings" tab**
3. **Scroll to "Volumes" section**
4. **Click "New Volume"**
5. **Configure:**
   - **Mount Path:** `/data`
   - **Size:** `1 GB`
6. **Click "Add"**

#### Step 4: Set Environment Variables

1. **Click "Variables" tab**
2. **Click "Add Variable"** and add each:

```bash
NODE_ENV=production
TZ=Asia/Singapore
DATABASE_PATH=/data/todos.db
```

#### Step 5: Generate Domain

1. **Go to "Settings" > "Networking"**
2. **Click "Generate Domain"**
3. **Copy your Railway domain** (e.g., `todo-app-production.up.railway.app`)

#### Step 6: Configure WebAuthn

**Add these variables with YOUR Railway domain:**

1. **Click "Variables" tab**
2. **Add these (replace with your actual domain):**

```bash
NEXT_PUBLIC_RP_ID=todo-app-production.up.railway.app
NEXT_PUBLIC_ORIGIN=https://todo-app-production.up.railway.app
NEXT_PUBLIC_RP_NAME=Todo App
NEXT_PUBLIC_APP_URL=https://todo-app-production.up.railway.app
```

#### Step 7: Redeploy

1. **Go to "Deployments" tab**
2. **Click "Redeploy"** (to apply environment variables)
3. **Wait ~2-3 minutes for build**

### ✅ Verify Deployment

1. **Visit your Railway URL**
2. **Register a new user** (uses passkey/biometric)
3. **Create a todo**
4. **Check timezone** (should show Singapore time)

### 🎉 Done!

Your app is now live and will automatically deploy on every push to main branch!

---

## Automatic GitHub Deployments

Railway automatically deploys when you push:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will:
1. Detect the push via GitHub webhook
2. Build the application (~2 minutes)
3. Deploy the new version
4. Update your live URL

### Monitor Deployments

**In Railway Dashboard:**
- **Deployments** tab - Build status
- **Logs** tab - Application output
- **Metrics** tab - Performance stats

---

## Common Issues & Solutions

### Database Resets on Deploy

**Problem:** Todos disappear after redeployment

**Solution:**
1. Verify volume is mounted at `/data`
2. Check `DATABASE_PATH=/data/todos.db` in variables
3. Redeploy

### WebAuthn Not Working

**Problem:** "Origin mismatch" or registration fails

**Solution:**
1. Update `NEXT_PUBLIC_RP_ID` with exact Railway domain
2. Update `NEXT_PUBLIC_ORIGIN` with `https://` prefix
3. Redeploy
4. Clear browser cache and try again

### Build Failures

**Problem:** `better-sqlite3` native binding error

**Solution:**
1. Ensure `nixpacks.toml` exists in root
2. Check it includes SQLite dependencies
3. Clear Railway cache: Settings > Danger Zone > Clear Cache
4. Redeploy

### Port Already in Use

**Problem:** "Error: listen EADDRINUSE"

**Solution:**
- Railway automatically assigns PORT
- Don't set PORT in environment variables
- Our code already uses `process.env.PORT || 3000`

---

## Advanced Configuration

### Custom Domain

1. **In Railway: Settings > Networking**
2. **Click "Custom Domain"**
3. **Enter your domain** (e.g., `todo.yourdomain.com`)
4. **Railway provides CNAME record**
5. **Add CNAME to your DNS provider:**
   ```
   Type: CNAME
   Name: todo
   Value: [Railway provides this]
   ```
6. **Wait for DNS propagation** (~5-60 minutes)
7. **Update WebAuthn environment variables** with new domain

### Database Backup

**Manual backup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Download database
railway run bash
# In Railway shell:
cp /data/todos.db /app/backup.db
# Then download backup.db from Railway
```

**Automated backup** (future):
- Consider Railway Cron jobs
- Or use GitHub Actions to schedule backups

### Monitoring & Alerts

**Railway provides:**
- Build notifications (email)
- Deployment status
- Memory/CPU metrics

**Additional monitoring:**
- Add custom health check endpoint
- Use external uptime monitors (UptimeRobot, etc.)
- Set up error tracking (Sentry, etc.)

---

## Resources

- **Full Checklist:** [RAILWAY_DEPLOYMENT_CHECKLIST.md](./RAILWAY_DEPLOYMENT_CHECKLIST.md)
- **Railway Docs:** https://docs.railway.app
- **Troubleshooting:** See checklist for detailed solutions

---

**Deployment Time:** ~5 minutes (first time), ~2 minutes (updates)
**Cost:** Free tier available, $5/month developer plan recommended
**Auto-deploy:** Enabled by default with GitHub integration
