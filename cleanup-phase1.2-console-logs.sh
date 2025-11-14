#!/bin/bash

# Remove console.log statements while keeping console.error and console.warn
# Phase 1.2: Console.log cleanup

echo "======================================"
echo "Phase 1.2: Remove console.log Statements"
echo "======================================"
echo ""

# Count console.log statements before
BEFORE_COUNT=$(grep -r "console\.log" src/ --include="*.js" --include="*.jsx" | wc -l)
echo "📊 Found $BEFORE_COUNT console.log statements to remove"
echo ""

# Files to process
FILES=$(find src/ -name "*.js" -o -name "*.jsx")

# Process each file
PROCESSED=0
for file in $FILES; do
  if grep -q "console\.log" "$file" 2>/dev/null; then
    # Remove console.log lines (but keep console.error and console.warn)
    sed -i '/console\.log(/d' "$file"
    PROCESSED=$((PROCESSED + 1))
  fi
done

# Count console.log statements after
AFTER_COUNT=$(grep -r "console\.log" src/ --include="*.js" --include="*.jsx" | wc -l)

echo "✅ Processed $PROCESSED files"
echo "✅ Removed $((BEFORE_COUNT - AFTER_COUNT)) console.log statements"
echo ""

# Verify console.error and console.warn are still present
ERROR_COUNT=$(grep -r "console\.error" src/ --include="*.js" --include="*.jsx" | wc -l)
WARN_COUNT=$(grep -r "console\.warn" src/ --include="*.js" --include="*.jsx" | wc -l)

echo "📊 Remaining console statements:"
echo "  - console.error: $ERROR_COUNT (kept for debugging)"
echo "  - console.warn: $WARN_COUNT (kept for warnings)"
echo "  - console.log: $AFTER_COUNT (should be 0)"
echo ""

if [ "$AFTER_COUNT" -eq 0 ]; then
  echo "✅ All console.log statements removed successfully!"
else
  echo "⚠️  Warning: $AFTER_COUNT console.log statements remain (may be multiline)"
fi

echo ""
echo "Next steps:"
echo "  1. Review changes: git diff src/"
echo "  2. Test app: npm start"
echo "  3. Commit: git add src/ && git commit -m 'Phase 1.2: Remove console.log statements'"
