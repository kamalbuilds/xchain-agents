#!/bin/bash

# Quick fix for Railway using Dockerfile instead of Nixpacks
echo "🔧 Railway Dockerfile vs Nixpacks Fix"
echo "===================================="

# Check if Dockerfile exists and is causing issues
if [ -f "Dockerfile" ]; then
    echo "🔍 Found Dockerfile that Railway is prioritizing over nixpacks.toml"
    echo "📝 Disabling Dockerfile to force nixpacks usage..."

    # Backup and disable Dockerfile
    mv Dockerfile Dockerfile.disabled
    echo "✅ Dockerfile disabled (renamed to Dockerfile.disabled)"
else
    echo "ℹ️  No Dockerfile found - Railway should use nixpacks.toml"
fi

# Verify nixpacks.toml exists
if [ -f "nixpacks.toml" ]; then
    echo "✅ nixpacks.toml found - Railway will use this for deployment"
else
    echo "❌ No nixpacks.toml found - creating minimal configuration..."
    cat > nixpacks.toml << 'EOF'
# Minimal Nixpacks configuration for Eliza
[phases.install]
cmds = [
    "npm install -g pnpm@latest",
    "pnpm install --frozen-lockfile"
]

[phases.build]
cmds = ["pnpm build"]

[start]
cmd = "pnpm start --non-interactive"

[variables.environment]
NODE_ENV = "production"
PORT = "3000"
EOF
    echo "✅ Created minimal nixpacks.toml"
fi

echo ""
echo "🚀 Ready to deploy! Next steps:"
echo "1. Commit these changes:"
echo "   git add ."
echo "   git commit -m 'Fix Railway deployment: disable Dockerfile, use nixpacks'"
echo "   git push"
echo ""
echo "2. Deploy via Railway:"
echo "   railway up"
echo ""
echo "3. Set environment variables in Railway dashboard:"
echo "   - NODE_ENV=production"
echo "   - OPENAI_API_KEY=your-api-key"