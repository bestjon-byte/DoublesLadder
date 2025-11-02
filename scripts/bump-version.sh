#!/bin/bash

# Simple version bumper that doesn't require npm
# Increments the patch version in package.json

PACKAGE_JSON="package.json"

# Read current version
CURRENT_VERSION=$(grep '"version"' $PACKAGE_JSON | sed 's/.*"version": "\([^"]*\)".*/\1/')

# Split version into major.minor.patch
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Increment patch
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

# Update package.json
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" $PACKAGE_JSON
rm -f ${PACKAGE_JSON}.bak

echo "$NEW_VERSION"
