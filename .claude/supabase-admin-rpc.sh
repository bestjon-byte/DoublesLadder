#!/bin/bash
# Supabase Admin RPC - Call database functions with full access
# Usage: ./supabase-admin-rpc.sh <function_name> [json_params]
# Examples:
#   ./supabase-admin-rpc.sh get_all_players_payment_summary '{}'
#   ./supabase-admin-rpc.sh validate_payment_token '{"p_token":"uuid-here"}'

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
    exit 1
fi

FUNCTION_NAME="$1"
PARAMS="$2"

if [ -z "$FUNCTION_NAME" ]; then
    echo "Usage: $0 <function_name> [json_params]"
    echo ""
    echo "Examples:"
    echo "  $0 get_all_players_payment_summary"
    echo "  $0 validate_payment_token '{\"p_token\":\"uuid\"}'"
    exit 1
fi

echo "Admin RPC: ${FUNCTION_NAME}" >&2

if [ -z "$PARAMS" ]; then
    # No parameters - don't send body
    curl -s "${SUPABASE_URL}/rest/v1/rpc/${FUNCTION_NAME}" \
        -H "apikey: ${SECRET_KEY}" \
        -H "Authorization: Bearer ${SECRET_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation"
else
    # With parameters
    curl -s "${SUPABASE_URL}/rest/v1/rpc/${FUNCTION_NAME}" \
        -H "apikey: ${SECRET_KEY}" \
        -H "Authorization: Bearer ${SECRET_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "${PARAMS}"
fi

echo "" >&2
