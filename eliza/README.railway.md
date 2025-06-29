# 🚂 Eliza Railway Deployment

> Complete guide for deploying Eliza AI agents on Railway using Nixpacks

## Quick Start

```bash
# 1. Validate deployment readiness
pnpm railway:validate

# 2. Deploy to Railway
pnpm railway:deploy
```

## 📋 Prerequisites

- ✅ [Railway Account](https://railway.app) (Free tier available)
- ✅ [GitHub Repository](https://github.com) with your Eliza code
- ✅ Node.js 22.x and pnpm installed locally
- ✅ Required API keys (OpenAI, etc.)

## 🏗️ Architecture

Eliza can be deployed in multiple configurations on Railway:

```
┌─────────────────┐    ┌─────────────────┐
│   Backend API   │    │  Client Frontend│
│   (Agent Core)  │◄───│   (Dashboard)   │
│                 │    │                 │
│ Port: 3000      │    │ Port: 4173      │
│ Health: 3001    │    │                 │
└─────────────────┘    └─────────────────┘
```

## 🚀 Deployment Options

### Option 1: Backend Only
Deploy just the AI agent backend:

```bash
# Root directory deployment
railway login
railway up
```

**Use case**: API-only deployment, external frontend

### Option 2: Frontend Only
Deploy just the React dashboard:

```bash
# From client directory
cd client
railway up
```

**Use case**: Static dashboard connecting to external API

### Option 3: Full Stack
Deploy both backend and frontend as separate services:

1. **Backend Service**: Root directory → `nixpacks.toml`
2. **Frontend Service**: `client/` directory → `client/nixpacks.toml`

**Use case**: Complete application deployment

## 📁 Configuration Files

Your project now includes these Railway-specific files:

```
├── nixpacks.toml                 # Backend deployment config
├── client/nixpacks.toml          # Frontend deployment config
├── client/nixpacks.static.toml   # Static frontend alternative
├── .railwayignore               # Optimize build size
├── railway.env.example          # Environment variables template
├── deploy-railway.sh            # Automated deployment script
├── validate-deployment.js       # Pre-deployment validation
├── RAILWAY_DEPLOYMENT.md        # Detailed deployment guide
└── agent/src/health.ts          # Health check endpoints
```

## 🔧 Environment Variables

### Required for Backend
```bash
NODE_ENV=production
OPENAI_API_KEY=sk-your-key-here
```

### Required for Frontend
```bash
VITE_API_URL=https://your-backend.railway.app
```

### Optional Integrations
```bash
# Social Media
TWITTER_USERNAME=your_bot
DISCORD_API_TOKEN=your_token
TELEGRAM_BOT_TOKEN=your_token

# Blockchain
WALLET_PRIVATE_KEY=0x...
COINBASE_API_KEY=your_key

# Database (auto-provided by Railway)
DATABASE_URL=postgresql://...
```

**⚠️ Security**: Set these in Railway dashboard, never commit to code!

## 🏃‍♂️ Deployment Steps

### 1. Prepare Your Code
```bash
# Validate deployment readiness
pnpm railway:validate

# Fix any issues reported
# Then re-validate until clean
```

### 2. Deploy Backend
```bash
# Option A: Automated script
./deploy-railway.sh

# Option B: Manual deployment
railway login
railway up
```

### 3. Configure Environment
1. Go to Railway dashboard
2. Select your service
3. Navigate to "Variables" tab
4. Add required environment variables
5. Redeploy service

### 4. Deploy Frontend (Optional)
```bash
# Create new service for frontend
cd client
railway up

# Set VITE_API_URL to backend service URL
railway variables set VITE_API_URL=https://your-backend.railway.app
```

## 📊 Monitoring

### Health Checks
Your deployment includes built-in health endpoints:

- `https://your-app.railway.app/health` - Service health status
- `https://your-app.railway.app/ready` - Readiness probe

### Logs
```bash
# View deployment logs
railway logs

# Follow live logs
railway logs --follow
```

### Metrics
- Railway dashboard provides CPU, memory, and network metrics
- Custom health endpoint reports memory usage
- Automatic crash detection and restart

## 🔍 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Check build logs in Railway dashboard
railway logs

# Common fixes:
- Verify pnpm-lock.yaml is committed
- Check Node.js version in nixpacks.toml
- Ensure all dependencies are in package.json
```

**Runtime Errors**
```bash
# Check runtime logs
railway logs --tail 100

# Common fixes:
- Verify environment variables are set
- Check database connection
- Validate API keys
```

**Connection Issues**
```bash
# Frontend can't reach backend
- Verify VITE_API_URL is correct
- Check CORS settings
- Ensure backend is deployed and running
```

### Debug Commands
```bash
# Validate configuration
pnpm railway:validate

# Check deployment status
railway status

# View environment variables
railway variables

# Test health endpoint
curl https://your-app.railway.app/health
```

## 💡 Optimization Tips

### Performance
- Use static deployment for frontend when possible
- Enable gzip compression
- Implement caching strategies
- Monitor memory usage

### Cost Optimization
- Use Railway's sleep mode for development
- Optimize build times with `.railwayignore`
- Consider usage-based pricing for production

### Security
- Never commit secrets to repository
- Use Railway's built-in secrets management
- Enable HTTPS (automatic on Railway)
- Implement rate limiting

## 🆙 Scaling

Railway provides automatic scaling options:

### Horizontal Scaling
```bash
# Scale to multiple instances
railway scale --replicas 3
```

### Vertical Scaling
```bash
# Upgrade to larger instance
railway scale --memory 2GB --cpu 1000m
```

### Database Scaling
```bash
# Add PostgreSQL service
railway add postgresql

# Add Redis for caching
railway add redis
```

## 📚 Resources

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Nixpacks Docs**: [nixpacks.com](https://nixpacks.com)
- **Eliza Docs**: [ai16z.github.io/eliza](https://ai16z.github.io/eliza)
- **Railway Discord**: Join for community support

## 🎯 Next Steps

After successful deployment:

1. **Configure Integrations**: Set up Discord, Twitter, Telegram bots
2. **Add Database**: Attach PostgreSQL for persistent storage
3. **Set Up Monitoring**: Configure alerts and dashboards
4. **Scale Resources**: Upgrade as needed for production load
5. **Custom Domain**: Add your own domain in Railway settings

---

## 🤝 Contributing

Found an issue with Railway deployment? Please:

1. Check existing GitHub issues
2. Run validation script: `pnpm railway:validate`
3. Include Railway logs in bug reports
4. Submit PRs for improvements

---

**Happy Deploying! 🚂✨**

*For detailed technical documentation, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)*