#!/bin/bash

# Vercel MCP Setup Script
# This script helps configure Vercel MCP integration for Claude Code

set -e

echo "🚀 Setting up Vercel MCP Integration"
echo "===================================="
echo ""

# Check if Vercel CLI is available
if ! command -v vercel >/dev/null 2>&1; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI available"
echo ""

# Step 1: Login to Vercel
echo "📝 Step 1: Login to Vercel"
echo "This will open your browser to authenticate with Vercel"
read -p "Press Enter to continue..."
vercel login

echo ""
echo "✅ Logged in to Vercel"

# Step 2: Link project
echo ""
echo "📁 Step 2: Link this project to Vercel"
echo "This will connect your local project to a Vercel deployment"
read -p "Press Enter to continue..."
vercel link

echo ""
echo "✅ Project linked to Vercel"

# Step 3: Get access token
echo ""
echo "🔑 Step 3: Get your Vercel access token"
echo ""
echo "1. Go to: https://vercel.com/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Name it: 'Claude Code MCP Integration'"
echo "4. Select scope: Full Account"
echo "5. Click 'Create Token'"
echo "6. Copy the token"
echo ""
echo "Then paste it below:"
read -p "Vercel Access Token: " VERCEL_TOKEN

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ No token provided. Exiting..."
    exit 1
fi

# Step 4: Update MCP configuration
echo ""
echo "🔧 Step 4: Updating MCP configuration..."

# Use sed to replace the placeholder token
sed -i.bak "s/PLACEHOLDER_TOKEN/$VERCEL_TOKEN/" .mcp.json

if [ $? -eq 0 ]; then
    rm .mcp.json.bak 2>/dev/null || true
    echo "✅ MCP configuration updated"
else
    echo "❌ Failed to update MCP configuration"
    exit 1
fi

# Step 5: Test the setup
echo ""
echo "🧪 Step 5: Testing Vercel integration..."

# Get project info to test
PROJECT_INFO=$(vercel ls --json 2>/dev/null | head -1)
if [ $? -eq 0 ] && [ "$PROJECT_INFO" != "[]" ]; then
    echo "✅ Vercel integration working"
else
    echo "⚠️  Vercel integration may have issues, but MCP is configured"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "✅ Vercel CLI installed and authenticated"
echo "✅ Project linked to Vercel"
echo "✅ Access token configured in MCP"
echo "✅ Claude Code can now:"
echo "   • Deploy your app directly"
echo "   • Check deployment logs"
echo "   • Monitor build status"
echo "   • Debug deployment issues"
echo ""
echo "🔄 Restart Claude Code to activate the new MCP server"
echo ""
echo "Next steps:"
echo "• Test deployment: vercel --prod"
echo "• View logs: vercel logs"
echo "• Check projects: vercel ls"