#!/bin/bash
# Supabase Query Helper - Reliable alternative to MCP
# Usage: ./supabase-query.sh <table> [filters]
# Examples:
#   ./supabase-query.sh coaching_attendance "payment_status=eq.unpaid"
#   ./supabase-query.sh "profiles?select=name,email&role=eq.admin"

set -e

PROJECT_REF="hwpjrkmplydqaxiikupv"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY="${REACT_APP_SUPABASE_ANON_KEY}"

# Try to get anon key from .env.local if not in environment
if [ -z "$ANON_KEY" ] && [ -f ".env.local" ]; then
    ANON_KEY=$(grep REACT_APP_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi

if [ -z "$ANON_KEY" ]; then
    echo "❌ Error: REACT_APP_SUPABASE_ANON_KEY not found"
    echo "Set it in .env.local or environment"
    exit 1
fi

# Get table/query parameter
QUERY="$1"
if [ -z "$QUERY" ]; then
    echo "Usage: $0 <table> [filters]"
    echo ""
    echo "Examples:"
    echo "  $0 profiles"
    echo "  $0 'profiles?select=name,email'"
    echo "  $0 'coaching_attendance?payment_status=eq.unpaid'"
    echo "  $0 'coaching_attendance?select=*,profiles(name)&payment_status=eq.unpaid'"
    exit 1
fi

# Add filters if provided
if [ ! -z "$2" ]; then
    if [[ "$QUERY" == *"?"* ]]; then
        QUERY="${QUERY}&${2}"
    else
        QUERY="${QUERY}?${2}"
    fi
fi

# Make the API request
echo "🔍 Querying: ${QUERY}" >&2
echo "" >&2

RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/${QUERY}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation")

# Pretty print if jq is available, otherwise raw output
if command -v jq &> /dev/null; then
    echo "$RESULT" | jq '.'
else
    echo "$RESULT"
fi

echo "" >&2
