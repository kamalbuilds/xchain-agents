#!/bin/bash

# Quick fix for Railway Docker Hub connection issues
# Run this script to apply immediate fixes for deployment problems

set -e

echo "🔧 Railway Deployment Quick Fix"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "🔍 Diagnosing deployment issues..."

# Backup original nixpacks config
if [ -f "nixpacks.toml" ]; then
    echo "📝 Backing up current nixpacks.toml..."
    cp nixpacks.toml nixpacks.toml.backup.$(date +%s)
fi

# Apply minimal configuration
echo "🔄 Applying minimal nixpacks configuration..."
cat > nixpacks.toml << 'EOF'
# Minimal Nixpacks configuration - fixes Docker Hub issues
# This uses Railway's default Node.js environment

[phases.install]
cmds = [
    "npm install -g pnpm@latest",
    "pnpm install --frozen-lockfile"
]

[phases.build]
cmds = [
    "pnpm build"
]

[start]
cmd = "pnpm start"

[variables.environment]
NODE_ENV = "production"
PORT = "3000"
EOF

echo "✅ Applied minimal configuration"

# Check if Railway CLI is available
if command -v railway &> /dev/null; then
    echo "🚂 Railway CLI found. Attempting deployment..."

    # Try to deploy with the new configuration
    if railway up; then
        echo "🎉 SUCCESS! Deployment completed with minimal configuration."
        echo ""
        echo "Next steps:"
        echo "1. Set your environment variables in Railway dashboard:"
        echo "   - NODE_ENV=production"
        echo "   - OPENAI_API_KEY=your-api-key"
        echo "2. Test your deployment at the provided URL"
        echo "3. Monitor logs: railway logs"
    else
        echo "❌ Deployment still failing. Trying alternative approach..."

        # Remove nixpacks.toml to let Railway auto-detect
        echo "🔄 Disabling nixpacks, using Railway auto-detection..."
        mv nixpacks.toml nixpacks.toml.disabled

        if railway up; then
            echo "🎉 SUCCESS! Deployment completed with Railway auto-detection."
            echo ""
            echo "Railway detected your Node.js project automatically."
            echo "You can re-enable nixpacks later once the initial deployment works."
        else
            echo "❌ Still failing. Manual intervention required."
            echo ""
            echo "Please try these manual steps:"
            echo "1. Go to Railway dashboard"
            echo "2. Delete the current service"
            echo "3. Create a new service"
            echo "4. Set Build Command: pnpm install && pnpm build"
            echo "5. Set Start Command: pnpm start"
            echo ""
            echo "For detailed troubleshooting, see: RAILWAY_TROUBLESHOOTING.md"
        fi
    fi
else
    echo "⚠️  Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    echo ""
    echo "Then run: railway login && railway up"
fi

echo ""
echo "🔍 If you continue to have issues:"
echo "1. Check Railway status: https://status.railway.app"
echo "2. Try deploying during off-peak hours"
echo "3. Consider using the Railway dashboard instead of CLI"
echo "4. Read the troubleshooting guide: RAILWAY_TROUBLESHOOTING.md"