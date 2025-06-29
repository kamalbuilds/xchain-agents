#!/bin/bash

# Eliza Railway Deployment Script
# This script helps deploy Eliza to Railway with minimal configuration

set -e

echo "🚂 Eliza Railway Deployment Script"
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login check
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Deployment options
echo ""
echo "Select deployment option:"
echo "1. Backend Agent only"
echo "2. Client Frontend only"
echo "3. Static Client only"
echo "4. Full Stack (Backend + Client)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🤖 Deploying Backend Agent..."

        # Check if deployment fails and offer fallback
        if ! railway up; then
            echo "❌ Deployment failed. Trying minimal configuration..."

            # Backup current config
            if [ -f "nixpacks.toml" ]; then
                cp nixpacks.toml nixpacks.toml.backup
                echo "📝 Backed up nixpacks.toml to nixpacks.toml.backup"
            fi

            # Use minimal config
            if [ -f "nixpacks.minimal.toml" ]; then
                cp nixpacks.minimal.toml nixpacks.toml
                echo "🔄 Using minimal nixpacks configuration..."

                # Try deployment again
                if railway up; then
                    echo "✅ Deployment successful with minimal configuration!"
                else
                    echo "❌ Deployment still failing. Please check RAILWAY_TROUBLESHOOTING.md"
                    # Restore original config
                    if [ -f "nixpacks.toml.backup" ]; then
                        mv nixpacks.toml.backup nixpacks.toml
                    fi
                    exit 1
                fi
            else
                echo "❌ nixpacks.minimal.toml not found. Please check RAILWAY_TROUBLESHOOTING.md"
                exit 1
            fi
        else
            echo "✅ Backend deployment complete!"
        fi

        echo "Don't forget to set your environment variables in Railway dashboard."
        ;;
    2)
        echo "🎨 Deploying Client Frontend..."
        cd client
        if [ ! -f "nixpacks.toml" ]; then
            echo "❌ Error: client/nixpacks.toml not found"
            exit 1
        fi
        railway up
        cd ..
        echo "✅ Client deployment complete!"
        echo "Remember to set VITE_API_URL in Railway dashboard."
        ;;
    3)
        echo "📁 Deploying Static Client..."
        cd client
        if [ ! -f "nixpacks.static.toml" ]; then
            echo "❌ Error: client/nixpacks.static.toml not found"
            exit 1
        fi
        # Note: Railway CLI doesn't support custom nixpacks config path yet
        echo "⚠️  Manual step required:"
        echo "1. Deploy via Railway dashboard"
        echo "2. Set Root Directory to 'client'"
        echo "3. Override Nixpacks Config Path to 'nixpacks.static.toml'"
        ;;
    4)
        echo "🚀 Deploying Full Stack..."
        echo ""
        echo "Step 1: Deploying Backend..."
        railway up

        echo ""
        echo "Step 2: Creating client service..."
        echo "⚠️  Manual step required:"
        echo "1. Create a new service in the same Railway project"
        echo "2. Connect the same repository"
        echo "3. Set Root Directory to 'client'"
        echo "4. Set VITE_API_URL to your backend service URL"
        echo "5. Deploy the client service"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Check deployment status in Railway dashboard"
echo "2. Set required environment variables"
echo "3. Monitor logs for any issues"
echo "4. Test your deployment"
echo ""
echo "📚 For detailed instructions, see RAILWAY_DEPLOYMENT.md"