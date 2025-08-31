#!/bin/bash

# Tennis Ladder App - Automated Deployment Script
# This script automates: git add → commit → push → Vercel deploy

set -e

PROJECT_DIR="/Users/jonbest/Documents/GitHub/DoublesLadder.Old"
MAIN_BRANCH="main"

echo "🚀 Starting automated deployment for Tennis Ladder App..."

# Navigate to project directory
cd "$PROJECT_DIR"

# Check if we're on the correct branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "$MAIN_BRANCH" ]; then
    echo "⚠️  Warning: Currently on branch '$current_branch', not '$MAIN_BRANCH'"
    echo "Switching to $MAIN_BRANCH branch..."
    git checkout "$MAIN_BRANCH"
fi

# Check for changes
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No changes to deploy"
    exit 0
fi

# Show current status
echo "📊 Current git status:"
git status --short

# Add all changes
echo "📦 Adding changes to git..."
git add .

# Check if there are staged changes
if git diff --staged --quiet; then
    echo "✅ No changes to commit after staging"
    exit 0
fi

# Generate commit message with timestamp
timestamp=$(date '+%Y-%m-%d %H:%M:%S')
commit_message="Deploy: Tennis Ladder App updates - $timestamp

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Commit changes
echo "💾 Committing changes..."
git commit -m "$commit_message"

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin "$MAIN_BRANCH"

# Wait a moment for GitHub to process
sleep 2

echo "✅ Successfully pushed to GitHub!"
echo "🌐 Vercel will automatically deploy from GitHub"
echo "📱 Check your Vercel dashboard for deployment status"

# Output deployment info for Claude
cat << EOF
{
  "deploymentStatus": "pushed_to_github",
  "branch": "$MAIN_BRANCH",
  "timestamp": "$timestamp",
  "message": "Changes pushed to GitHub. Vercel will automatically deploy.",
  "vercelDashboard": "https://vercel.com/dashboard"
}
EOF