#!/bin/bash

# Deployment script for Tennis Ladder App
# This script increments version numbers and ensures cache busting

echo "🎾 Tennis Ladder Deployment Script"
echo "=================================="

# Get current version from package.json or set default
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
echo "Current version: $CURRENT_VERSION"

# Increment patch version (you can modify this logic as needed)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo "New version: $NEW_VERSION"

# Update service worker version
echo "📝 Updating service worker version..."
sed -i.bak "s/const APP_VERSION = '[^']*'/const APP_VERSION = '$NEW_VERSION'/" public/sw.js
if [ $? -eq 0 ]; then
    echo "✅ Service worker version updated"
    rm public/sw.js.bak 2>/dev/null
else
    echo "❌ Failed to update service worker version"
    exit 1
fi

# Update version manager version
echo "📝 Updating version manager version..."
sed -i.bak "s/export const APP_VERSION = '[^']*'/export const APP_VERSION = '$NEW_VERSION'/" src/utils/versionManager.js
if [ $? -eq 0 ]; then
    echo "✅ Version manager version updated"
    rm src/utils/versionManager.js.bak 2>/dev/null
else
    echo "❌ Failed to update version manager version"
    exit 1
fi

# Update package.json if it exists
if [ -f "package.json" ]; then
    echo "📝 Updating package.json version..."
    npm version $NEW_VERSION --no-git-tag-version
    echo "✅ Package.json version updated"
fi

# Add timestamp to build
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "📝 Adding build timestamp: $TIMESTAMP"

# Create a build info file that can be used for cache busting
echo "{\"version\":\"$NEW_VERSION\",\"buildTime\":\"$TIMESTAMP\",\"buildDate\":\"$(date)\"}" > public/build-info.json
echo "✅ Build info created"

echo ""
echo "🚀 Deployment preparation complete!"
echo "Version: $NEW_VERSION"
echo "Build ID: $TIMESTAMP"
echo ""
echo "Next steps:"
echo "1. Test the app locally"
echo "2. Commit and push changes"
echo "3. Deploy to your hosting service"
echo ""
echo "Cache busting features enabled:"
echo "✅ Service worker version management"
echo "✅ Automatic update notifications"
echo "✅ Cache clearing on version mismatch"
echo "✅ Build timestamp for asset cache busting"