# Eliza Railway Deployment Guide

This guide covers deploying the Eliza project on [Railway](https://railway.app) using [Nixpacks](https://nixpacks.com) configurations.

## Overview

Railway is a platform-as-a-service that uses Nixpacks for zero-config deployments. The Eliza project can be deployed in several configurations:

1. **Backend Agent** - The main Eliza agent service
2. **Client Frontend** - The React/Vite dashboard
3. **Static Client** - Client deployed as static files
4. **Full Stack** - Both backend and frontend

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your Eliza code pushed to GitHub
3. **Environment Variables**: Prepared for your deployment

## Deployment Options

### Option 1: Backend Agent Deployment

Deploy the main Eliza agent service that handles AI interactions and blockchain operations.

**Steps:**
1. Create new project on Railway
2. Connect your GitHub repository
3. Railway will auto-detect the `nixpacks.toml` configuration
4. Set environment variables (see [Environment Variables](#environment-variables))
5. Deploy

**Configuration Used:** `nixpacks.toml` (root directory)

### Option 2: Client Frontend Deployment

Deploy the React dashboard interface.

**Steps:**
1. Create new service in Railway
2. Connect repository and set **Root Directory** to `client`
3. Railway will use `client/nixpacks.toml`
4. Set `VITE_API_URL` environment variable
5. Deploy

**Configuration Used:** `client/nixpacks.toml`

### Option 3: Static Client Deployment

Deploy the client as static files with Nginx.

**Steps:**
1. Create new service in Railway
2. Set **Root Directory** to `client`
3. In service settings, override **Nixpacks Config Path** to `nixpacks.static.toml`
4. Set environment variables
5. Deploy

**Configuration Used:** `client/nixpacks.static.toml`

### Option 4: Full Stack Deployment

Deploy both backend and frontend as separate services.

**Steps:**
1. **Backend Service:**
   - Create service from root directory
   - Uses `nixpacks.toml`
   - Set backend environment variables

2. **Frontend Service:**
   - Create second service with `client` root directory
   - Uses `client/nixpacks.toml`
   - Set `VITE_API_URL` to backend service URL

## Environment Variables

### Backend Agent Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Node environment | `production` |
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-...` |
| `TWITTER_USERNAME` | Optional | Twitter bot username | `@your_bot` |
| `TWITTER_PASSWORD` | Optional | Twitter bot password | `password` |
| `TWITTER_EMAIL` | Optional | Twitter bot email | `bot@example.com` |
| `DISCORD_APPLICATION_ID` | Optional | Discord app ID | `123...` |
| `DISCORD_API_TOKEN` | Optional | Discord bot token | `MTI...` |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token | `123:ABC...` |
| `DATABASE_URL` | Optional | Database connection | `postgresql://...` |
| `WALLET_PRIVATE_KEY` | Optional | Blockchain wallet key | `0x...` |
| `COINBASE_API_KEY` | Optional | Coinbase API key | `organizations/...` |
| `COINBASE_PRIVATE_KEY` | Optional | Coinbase private key | `-----BEGIN...` |

### Frontend Client Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://your-backend.railway.app` |

## Railway-Specific Configuration

### Service Settings

**Backend Agent:**
- **Framework**: Nixpacks (auto-detected)
- **Build Command**: Auto-detected from nixpacks.toml
- **Start Command**: Auto-detected from nixpacks.toml
- **Port**: 3000 (default)

**Client Frontend:**
- **Framework**: Nixpacks (auto-detected)
- **Root Directory**: `client`
- **Build Command**: Auto-detected
- **Start Command**: Auto-detected
- **Port**: 4173 (Vite preview) or 80 (static)

### Custom Domains

1. Go to your service settings in Railway
2. Navigate to "Networking" tab
3. Add your custom domain
4. Update DNS records as instructed

### Database Setup

If using a database:

1. Add **PostgreSQL** service to your Railway project
2. Copy the `DATABASE_URL` from PostgreSQL service
3. Add it to your backend service environment variables

## Monitoring and Logs

### Viewing Logs
1. Go to your service in Railway dashboard
2. Click on "Deployments" tab
3. Select a deployment to view logs

### Health Checks
Railway automatically monitors your service health. Configure custom health checks if needed:

```toml
# Add to your nixpacks.toml
[healthcheck]
path = "/health"
interval = "30s"
timeout = "10s"
retries = 3
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Railway dashboard
   - Verify all dependencies in `package.json`
   - Ensure pnpm workspace dependencies are resolved

2. **Runtime Errors**
   - Check service logs for error messages
   - Verify environment variables are set correctly
   - Ensure database connections are working

3. **Client-Backend Connection Issues**
   - Verify `VITE_API_URL` points to correct backend URL
   - Check CORS settings on backend
   - Ensure backend is deployed and running

4. **Memory Issues**
   - Upgrade Railway plan for more resources
   - Optimize application memory usage
   - Review package dependencies

### Deployment Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to existing project
railway link

# Deploy current branch
railway up

# View logs
railway logs

# Open service URL
railway open
```

## Performance Optimization

### Backend Optimization
- Use connection pooling for databases
- Implement caching strategies
- Optimize AI model loading
- Use environment variables for configuration

### Frontend Optimization
- Use static deployment for better performance
- Implement proper caching headers
- Optimize bundle size with Vite
- Use CDN for static assets

## Scaling Considerations

Railway supports automatic scaling. For high-traffic deployments:

1. **Horizontal Scaling**: Deploy multiple instances
2. **Database Optimization**: Use read replicas
3. **Caching**: Implement Redis for session/data caching
4. **Load Balancing**: Railway handles this automatically

## Security Best Practices

1. **Environment Variables**: Never commit secrets to code
2. **Database Security**: Use connection strings with authentication
3. **API Security**: Implement rate limiting and authentication
4. **CORS Configuration**: Restrict origins appropriately
5. **HTTPS**: Railway provides SSL automatically

## Support and Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Nixpacks Documentation**: [nixpacks.com](https://nixpacks.com)
- **Railway Discord**: Join for community support
- **GitHub Issues**: Report bugs in the Eliza repository

---

**Note**: Railway pricing is based on usage. Monitor your resource consumption and upgrade plans as needed for production deployments.