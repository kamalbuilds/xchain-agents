# 🚂 Railway Deployment Troubleshooting Guide

## Common Error: Docker Hub Connection Issues

### Error Message:
```
failed to copy: httpReadSeeker: failed open: failed to do request:
Get "https://registry-1.docker.io/v2/library/node/blobs/sha256:...":
context canceled: context canceled
```

### What This Means:
- Railway is trying to pull a Docker image from Docker Hub
- The connection is timing out or being canceled
- This can happen due to network issues, rate limiting, or Docker Hub outages

## 🔧 Quick Fixes

### Solution 1: Use Minimal Configuration

1. **Rename your current nixpacks.toml:**
   ```bash
   mv nixpacks.toml nixpacks.toml.backup
   ```

2. **Use the minimal configuration:**
   ```bash
   cp nixpacks.minimal.toml nixpacks.toml
   ```

3. **Redeploy:**
   ```bash
   git add nixpacks.toml
   git commit -m "Use minimal nixpacks config"
   git push
   ```

### Solution 2: Manual Railway Configuration

Instead of using nixpacks.toml, configure Railway manually:

1. **In Railway Dashboard:**
   - Go to your service settings
   - Navigate to "Build" section
   - Set these values:

   ```
   Build Command: pnpm install && pnpm build
   Start Command: pnpm start
   ```

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```

### Solution 3: Deploy Without Nixpacks

Use Railway's auto-detection:

1. **Remove nixpacks.toml temporarily:**
   ```bash
   mv nixpacks.toml nixpacks.toml.disabled
   ```

2. **Let Railway auto-detect (should work with package.json):**
   ```bash
   git add .
   git commit -m "Disable nixpacks, use auto-detection"
   git push
   ```

## 🔍 Detailed Solutions

### Check Railway Service Logs

1. **View build logs:**
   ```bash
   railway logs --deployment
   ```

2. **View runtime logs:**
   ```bash
   railway logs
   ```

### Verify Your Configuration

1. **Check your package.json scripts:**
   ```json
   {
     "scripts": {
       "start": "pnpm --filter \"@ai16z/agent\" start --isRoot",
       "build": "turbo run build --filter=!eliza-docs"
     }
   }
   ```

2. **Ensure pnpm-lock.yaml is committed:**
   ```bash
   git add pnpm-lock.yaml
   git commit -m "Add pnpm lock file"
   ```

### Railway-Specific Environment Variables

Set these in Railway dashboard:

```bash
# Required
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-key

# Optional (based on your needs)
TWITTER_USERNAME=your_bot_username
DISCORD_API_TOKEN=your_discord_token
DATABASE_URL=postgresql://... # Auto-provided if you add PostgreSQL service
```

## 🚨 Emergency Deployment Methods

### Method 1: Fork and Deploy

If the main deployment keeps failing:

1. **Create a minimal deployment branch:**
   ```bash
   git checkout -b railway-deploy
   ```

2. **Simplify package.json:**
   ```json
   {
     "name": "eliza-railway",
     "scripts": {
       "start": "node agent/src/index.js",
       "build": "echo 'No build needed'"
     },
     "dependencies": {
       "// Add only essential dependencies here"
     }
   }
   ```

3. **Deploy the simplified version first, then gradually add complexity**

### Method 2: Use Different Base

1. **Try Railway's Node.js template:**
   - Create new Railway project
   - Choose "Node.js" template
   - Connect your repository

### Method 3: Deploy Agent Only

1. **Deploy just the agent directory:**
   - Set Railway root directory to `/agent`
   - This reduces complexity and dependencies

## 🐛 Debug Commands

### Check Your Setup
```bash
# Validate deployment readiness
pnpm railway:validate

# Check Railway CLI connection
railway whoami

# Check project linking
railway status
```

### Test Locally
```bash
# Test the exact commands Railway will run
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

### Railway CLI Debug
```bash
# View detailed deployment info
railway logs --tail 100

# Check environment variables
railway variables

# Force redeploy
railway redeploy
```

## 🔄 Alternative Deployment Platforms

If Railway continues to have issues:

### 1. Vercel (for client)
```bash
cd client
npx vercel
```

### 2. Render (for backend)
- Connect GitHub repository
- Use: `pnpm install && pnpm build`
- Start: `pnpm start`

### 3. Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
```

## 📞 Getting Help

### Railway Support
1. **Railway Discord**: Join the Railway community
2. **Railway Status**: Check status.railway.app
3. **Railway Docs**: docs.railway.app

### GitHub Issues
If this is a recurring issue:
1. Check existing issues in the Eliza repository
2. Create a new issue with:
   - Full error logs
   - nixpacks.toml content
   - Railway service configuration

## 💡 Prevention Tips

### 1. Keep Dependencies Minimal
- Only include necessary packages
- Use `pnpm install --production` for production builds

### 2. Optimize Build Times
- Use `.railwayignore` to exclude unnecessary files
- Consider using Railway's build cache

### 3. Monitor Railway Status
- Follow @Railway on Twitter for outage notifications
- Check Railway status page before deploying

---

## 🚀 Success Checklist

After resolving deployment issues:

- [ ] ✅ Service deploys successfully
- [ ] ✅ Health endpoint responds: `/health`
- [ ] ✅ Environment variables are set
- [ ] ✅ Logs show no errors
- [ ] ✅ Agent responds to requests

---

**Remember**: Railway deployment issues are often temporary. Try the minimal configuration first, then gradually add complexity once basic deployment works.