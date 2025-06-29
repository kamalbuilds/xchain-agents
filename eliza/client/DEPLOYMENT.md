# Eliza Client Deployment Guide for Vercel

## Prerequisites

1. **Backend API**: The Eliza client requires a backend API to be deployed first. Make sure you have:
   - An Eliza agent backend deployed and accessible
   - The backend URL (e.g., `https://your-eliza-backend.vercel.app`)

2. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)

3. **GitHub Repository**: Your code should be pushed to a GitHub repository

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Navigate to the client directory**:
   ```bash
   cd client
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Set up environment variables**:
   ```bash
   # Set your backend API URL
   vercel env add VITE_API_URL
   # When prompted, enter your backend URL: https://your-eliza-backend.vercel.app
   # Select: Production, Preview, and Development
   ```

5. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `client` directory as the root directory

2. **Configure Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

3. **Set Environment Variables**:
   - In the project settings, go to "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-eliza-backend.vercel.app`
   - Apply to: Production, Preview, and Development

4. **Deploy**:
   - Click "Deploy"

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://your-eliza-backend.vercel.app` |

⚠️ **Important**: Variables prefixed with `VITE_` are exposed to the client-side code. Only add variables that are safe to be public.

## Configuration Files

The project already includes the necessary configuration files:

- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `vite.config.ts` - Vite build configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `src/config/api.ts` - API configuration with environment variable support

## Post-Deployment

1. **Verify Deployment**:
   - Check that the site loads at your Vercel URL
   - Open browser developer tools and check for API connection errors
   - Ensure the events sidebar connects to your backend

2. **Custom Domain** (Optional):
   - In Vercel dashboard, go to your project settings
   - Add your custom domain under "Domains"

## Troubleshooting

### Common Issues

1. **API Connection Errors**:
   - Verify `VITE_API_URL` is correctly set
   - Ensure your backend is deployed and accessible
   - Check CORS settings on your backend

2. **Build Failures**:
   - Ensure all dependencies are listed in `package.json`
   - Check that TypeScript errors are resolved
   - Verify workspace dependencies are properly configured

3. **Environment Variables Not Working**:
   - Ensure variables are prefixed with `VITE_`
   - Redeploy after adding new environment variables
   - Check variable names for typos

### Logs and Debugging

- **Build Logs**: Available in Vercel dashboard under "Functions" tab
- **Runtime Logs**: Check browser developer tools console
- **API Errors**: Monitor network tab in developer tools

## Production Considerations

1. **Backend Deployment**: Ensure your Eliza backend is also deployed and stable
2. **CORS Configuration**: Backend must allow requests from your Vercel domain
3. **Rate Limiting**: Consider implementing rate limiting on your backend
4. **Error Monitoring**: Set up error tracking (e.g., Sentry) for production monitoring

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev)
- **Eliza Documentation**: Check the main project documentation

---

**Note**: This deployment guide assumes you're deploying a frontend-only application. For a full-stack deployment including the backend, you'll need to deploy the Eliza backend separately and configure the API URL accordingly.