#!/bin/bash

# Eliza Client Deployment Script for Vercel
# This script helps deploy the Eliza client to Vercel

set -e

echo "🚀 Eliza Client Deployment Script"
echo "================================"

# Check if we're in the client directory
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    echo "❌ Error: Please run this script from the client directory"
    echo "Usage: cd client && ./deploy.sh"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
fi

# Prompt for backend API URL if not already set
echo "🔧 Setting up environment variables..."
echo "Enter your Eliza backend API URL (e.g., https://your-backend.vercel.app):"
echo "Press Enter to skip if already configured:"
read -r BACKEND_URL

if [ ! -z "$BACKEND_URL" ]; then
    echo "Setting VITE_API_URL environment variable..."
    vercel env add VITE_API_URL <<< "$BACKEND_URL
y
y
y"
fi

# Build and deploy
echo "🏗️  Building and deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check your deployment at the provided URL"
echo "2. Test the connection to your backend API"
echo "3. Monitor the browser console for any errors"
echo ""
echo "If you encounter issues, check the deployment logs in your Vercel dashboard."