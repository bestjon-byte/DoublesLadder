#!/bin/bash
# Supabase Admin Query - Full CRUD access using secret key
# Usage: ./supabase-admin.sh <method> <endpoint> [data]
# Examples:
#   ./supabase-admin.sh GET 'profiles?select=name,email&limit=5'
#   ./supabase-admin.sh PATCH 'profiles?id=eq.UUID' '{"name":"New Name"}'
#   ./supabase-admin.sh POST 'coaching_sessions' '{"session_date":"2025-01-31"}'
#   ./supabase-admin.sh DELETE 'coaching_attendance?id=eq.UUID'

set -e

PROJECT_REF="hwpjrkmplydqaxiikupv"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SECRET_KEY="${SUPABASE_SECRET_KEY}"

# Try to get secret key from .env.local if not in environment
if [ -z "$SECRET_KEY" ] && [ -f ".env.local" ]; then
    SECRET_KEY=$(grep SUPABASE_SECRET_KEY .env.local | cut -d '=' -f2)
fi

if [ -z "$SECRET_KEY" ]; then
    echo "Error: SUPABASE_SECRET_KEY not found"
    echo "Add it to .env.local: SUPABASE_SECRET_KEY=sb_secret_..."
    exit 1
fi

METHOD="${1:-GET}"
ENDPOINT="$2"
DATA="$3"

if [ -z "$ENDPOINT" ]; then
    echo "Usage: $0 <METHOD> <endpoint> [json_data]"
    echo ""
    echo "Methods: GET, POST, PATCH, DELETE"
    echo ""
    echo "Examples:"
    echo "  $0 GET 'profiles?select=name,email'"
    echo "  $0 PATCH 'profiles?id=eq.UUID' '{\"name\":\"New\"}'"
    echo "  $0 POST 'table' '{\"field\":\"value\"}'"
    echo "  $0 DELETE 'table?id=eq.UUID'"
    exit 1
fi

echo "Admin ${METHOD}: ${ENDPOINT}" >&2

if [ -z "$DATA" ]; then
    # GET or DELETE without body
    curl -s -X "${METHOD}" "${SUPABASE_URL}/rest/v1/${ENDPOINT}" \
        -H "apikey: ${SECRET_KEY}" \
        -H "Authorization: Bearer ${SECRET_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation"
else
    # POST/PATCH with body
    curl -s -X "${METHOD}" "${SUPABASE_URL}/rest/v1/${ENDPOINT}" \
        -H "apikey: ${SECRET_KEY}" \
        -H "Authorization: Bearer ${SECRET_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "${DATA}"
fi

echo "" >&2
