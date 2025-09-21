#!/bin/bash

# Quick Deploy - One-command deployment with smart commit messages
# Usage: ./scripts/quick-deploy.sh [optional custom message]

set -e

echo "🚀 Quick Deploy - Tennis Ladder App"
echo "==================================="

# Check if we're in git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check for changes
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ No changes to deploy"
    exit 0
fi

# Custom message provided?
if [ -n "$1" ]; then
    echo "📝 Using custom message: $1"
    CUSTOM_MESSAGE="$1"
else
    CUSTOM_MESSAGE=""
fi

# Run version update
echo "🔄 Updating version..."
./scripts/deploy.sh > /dev/null 2>&1 || echo "⚠️  Version update skipped"

# Get version
NEW_VERSION=$(grep "const APP_VERSION = " public/sw.js | sed "s/.*'\([^']*\)'.*/\1/" 2>/dev/null || echo "latest")

# Quick commit message if not provided
if [ -z "$CUSTOM_MESSAGE" ]; then
    # Analyze changes quickly
    if git diff --name-only | grep -q -E "(LoadingScreen|Navigation|Modal|\.html)"; then
        CUSTOM_MESSAGE="UI/UX improvements and updates"
    elif git diff --name-only | grep -q -E "(sw\.js|cache|version)"; then
        CUSTOM_MESSAGE="Cache management and auto-update improvements"
    elif git diff --name-only | grep -q -E "(components/)"; then
        CUSTOM_MESSAGE="Component updates and enhancements"
    elif git diff --name-only | grep -q -E "(utils/|hooks/)"; then
        CUSTOM_MESSAGE="Feature updates and functionality improvements"
    else
        CUSTOM_MESSAGE="App improvements and bug fixes"
    fi
fi

# Build commit message
COMMIT_MESSAGE="$CUSTOM_MESSAGE

🚀 Generated with Claude Code
📱 Version $NEW_VERSION

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "📤 Committing: $CUSTOM_MESSAGE"

# Stage, commit, and push
git add .
git commit -m "$COMMIT_MESSAGE"

# Try to push, with better error handling
echo "🚀 Pushing to GitHub..."
if git push; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Push failed. This is likely an authentication issue."
    echo ""
    echo "To fix this, you have a few options:"
    echo ""
    echo "1. Use GitHub CLI (recommended):"
    echo "   • Install: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "   • Then: gh auth login"
    echo ""
    echo "2. Or use a Personal Access Token:"
    echo "   • Go to GitHub Settings > Developer Settings > Personal Access Tokens"
    echo "   • Create a token with 'repo' permissions"
    echo "   • Run: git remote set-url origin https://bestjon-byte:YOUR_TOKEN@github.com/bestjon-byte/DoublesLadder.git"
    echo ""
    echo "3. Or push manually with credentials:"
    echo "   • Run: git push"
    echo "   • Enter your GitHub username and token when prompted"
    echo ""
    echo "The commit was created successfully, so you just need to push it."
    exit 1
fi

echo ""
echo "✅ Deploy complete!"
echo "📱 Version: $NEW_VERSION"
echo "🔄 Users will receive automatic update notifications"

# Optional: Deploy to Vercel if CLI is available
if command -v vercel >/dev/null 2>&1; then
    echo ""
    echo "🚀 Deploying to Vercel..."
    vercel --prod --yes
    echo "✅ Vercel deployment complete!"
else
    echo ""
    echo "💡 Install Vercel CLI for automatic deployments:"
    echo "   npm i -g vercel"
    echo "   vercel login"
    echo "   vercel link"
fi