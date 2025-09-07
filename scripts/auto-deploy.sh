#!/bin/bash

# Automated Deployment Script for Tennis Ladder App
# Handles version bumping, git operations, and intelligent commit messages

set -e  # Exit on any error

echo "🎾 Tennis Ladder Auto-Deployment Script"
echo "======================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "📋 Analyzing changes..."
    
    # Get list of changed files
    CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo "")
    STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
    ALL_CHANGED_FILES="$CHANGED_FILES $STAGED_FILES"
    
    echo "Changed files: $(echo $ALL_CHANGED_FILES | tr ' ' '\n' | sort -u | tr '\n' ' ')"
else
    echo "✅ No changes to deploy"
    exit 0
fi

# Determine deployment type based on command line argument
DEPLOY_TYPE=${1:-"auto"}
case $DEPLOY_TYPE in
    "major"|"minor"|"patch"|"auto")
        ;;
    *)
        echo "Usage: $0 [major|minor|patch|auto]"
        echo "  major: Breaking changes (1.0.0 -> 2.0.0)"
        echo "  minor: New features (1.0.0 -> 1.1.0)" 
        echo "  patch: Bug fixes (1.0.0 -> 1.0.1)"
        echo "  auto: Automatically determine type (default)"
        exit 1
        ;;
esac

# Run the existing deploy.sh script for version management
echo "🔄 Running version update..."
if [ -f "./scripts/deploy.sh" ]; then
    ./scripts/deploy.sh
    if [ $? -ne 0 ]; then
        echo "❌ Version update failed"
        exit 1
    fi
else
    echo "⚠️  deploy.sh not found, continuing without version update"
fi

# Get the new version
NEW_VERSION=$(grep "const APP_VERSION = " public/sw.js | sed "s/.*'\([^']*\)'.*/\1/" || echo "1.0.0")
echo "📋 Version: $NEW_VERSION"

# Generate intelligent commit message based on changed files
echo "🤖 Generating commit message..."

# Initialize arrays for different types of changes
declare -a UI_CHANGES=()
declare -a FEATURE_CHANGES=()
declare -a BUG_FIXES=()
declare -a CONFIG_CHANGES=()
declare -a COMPONENT_CHANGES=()

# Analyze changed files
for file in $ALL_CHANGED_FILES; do
    if [[ -n "$file" ]]; then
        case $file in
            # UI and styling changes
            **/LoadingScreen.js|**/Navigation.js|**/*Modal.js|**/index.html)
                if git diff HEAD "$file" 2>/dev/null | grep -q -i -E "(style|css|class|animation|color|bg-|text-|flex|grid)"; then
                    UI_CHANGES+=("$file")
                fi
                ;;
            
            # Component updates
            **/components/**)
                COMPONENT_CHANGES+=("$(basename $file .js)")
                ;;
            
            # Feature-related files
            **/hooks/*|**/utils/*|**/contexts/*)
                FEATURE_CHANGES+=("$file")
                ;;
            
            # Configuration files
            *.json|*.sh|sw.js|*.html|*.md)
                CONFIG_CHANGES+=("$file")
                ;;
        esac
    fi
done

# Build commit message
COMMIT_MSG=""
COMMIT_DETAILS=""

# Determine main action
if [ ${#UI_CHANGES[@]} -gt 0 ]; then
    COMMIT_MSG="Update UI/UX improvements"
    if [[ " ${UI_CHANGES[@]} " =~ "LoadingScreen.js" ]]; then
        COMMIT_DETAILS="${COMMIT_DETAILS}- Enhanced loading screen animation\n"
    fi
    if [[ " ${UI_CHANGES[@]} " =~ "Navigation.js" ]]; then
        COMMIT_DETAILS="${COMMIT_DETAILS}- Improved navigation design\n"
    fi
    if [[ " ${UI_CHANGES[@]} " =~ "index.html" ]]; then
        COMMIT_DETAILS="${COMMIT_DETAILS}- Updated app configuration\n"
    fi
elif [ ${#FEATURE_CHANGES[@]} -gt 0 ]; then
    COMMIT_MSG="Add new features and functionality"
    for feature in "${FEATURE_CHANGES[@]}"; do
        case $feature in
            **/hooks/*) COMMIT_DETAILS="${COMMIT_DETAILS}- Enhanced application hooks\n" ;;
            **/utils/*) COMMIT_DETAILS="${COMMIT_DETAILS}- Added utility functions\n" ;;
            **/contexts/*) COMMIT_DETAILS="${COMMIT_DETAILS}- Updated app context\n" ;;
        esac
    done
elif [ ${#COMPONENT_CHANGES[@]} -gt 0 ]; then
    COMMIT_MSG="Update app components"
    # Get unique components
    UNIQUE_COMPONENTS=($(printf '%s\n' "${COMPONENT_CHANGES[@]}" | sort -u))
    for component in "${UNIQUE_COMPONENTS[@]}"; do
        COMMIT_DETAILS="${COMMIT_DETAILS}- Updated ${component} component\n"
    done
elif [ ${#CONFIG_CHANGES[@]} -gt 0 ]; then
    COMMIT_MSG="Configuration and deployment updates"
    for config in "${CONFIG_CHANGES[@]}"; do
        case $config in
            sw.js) COMMIT_DETAILS="${COMMIT_DETAILS}- Updated service worker for cache management\n" ;;
            *.json) COMMIT_DETAILS="${COMMIT_DETAILS}- Updated configuration files\n" ;;
            *.sh) COMMIT_DETAILS="${COMMIT_DETAILS}- Enhanced deployment scripts\n" ;;
            *.html) COMMIT_DETAILS="${COMMIT_DETAILS}- Updated app metadata\n" ;;
        esac
    done
else
    COMMIT_MSG="General app improvements"
    COMMIT_DETAILS="- Various bug fixes and enhancements\n"
fi

# Check for specific patterns in git diff to enhance commit message
GIT_DIFF=$(git diff --cached 2>/dev/null || git diff 2>/dev/null)

if echo "$GIT_DIFF" | grep -q -i "swipe"; then
    COMMIT_DETAILS="${COMMIT_DETAILS}- Updated swipe gesture functionality\n"
fi

if echo "$GIT_DIFF" | grep -q -i -E "(cache|version|service.?worker)"; then
    COMMIT_DETAILS="${COMMIT_DETAILS}- Improved cache management and auto-updates\n"
fi

if echo "$GIT_DIFF" | grep -q -i -E "(safe.?area|notch|ios)"; then
    COMMIT_DETAILS="${COMMIT_DETAILS}- Fixed iOS safe area and notch compatibility\n"
fi

if echo "$GIT_DIFF" | grep -q -i -E "(haptic|feedback)"; then
    COMMIT_DETAILS="${COMMIT_DETAILS}- Enhanced haptic feedback for better UX\n"
fi

# Build final commit message
FINAL_COMMIT_MSG="$COMMIT_MSG

$COMMIT_DETAILS
🚀 Generated with Claude Code
📱 Version $NEW_VERSION

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "📝 Generated commit message:"
echo "=========================="
echo "$FINAL_COMMIT_MSG"
echo "=========================="
echo ""

# Ask for confirmation
read -p "❓ Proceed with this commit message? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Stage all changes
echo "📤 Staging changes..."
git add .

# Commit with generated message
echo "💾 Creating commit..."
git commit -m "$FINAL_COMMIT_MSG"

if [ $? -ne 0 ]; then
    echo "❌ Commit failed"
    exit 1
fi

echo "✅ Commit created successfully"

# Push to remote
echo "🚀 Pushing to remote repository..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Branch: $CURRENT_BRANCH"

git push origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "========================"
    echo "✅ Version: $NEW_VERSION"
    echo "✅ Branch: $CURRENT_BRANCH" 
    echo "✅ Files updated and pushed to GitHub"
    echo "✅ Cache busting enabled for users"
    echo ""
    echo "📱 Users will automatically receive update notifications"
    echo "🔄 Service worker will handle cache clearing"
    echo ""
else
    echo "❌ Push failed - check your git configuration and network connection"
    exit 1
fi