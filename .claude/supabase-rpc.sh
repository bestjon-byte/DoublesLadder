#!/bin/bash
# Supabase RPC Function Caller - Call database functions directly
# Usage: ./supabase-rpc.sh <function_name> <json_params>
# Examples:
#   ./supabase-rpc.sh get_all_players_payment_summary '{}'
#   ./supabase-rpc.sh get_player_payment_summary '{"p_player_id":"uuid-here","p_session_cost":4.00}'
#   ./supabase-rpc.sh validate_payment_token '{"p_token":"token-uuid-here"}'

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

# Get function name and params
FUNCTION_NAME="$1"
PARAMS="${2:-{}}"

if [ -z "$FUNCTION_NAME" ]; then
    echo "Usage: $0 <function_name> [json_params]"
    echo ""
    echo "Common RPC Functions:"
    echo "  get_all_players_payment_summary"
    echo "  get_player_payment_summary"
    echo "  validate_payment_token"
    echo "  create_payment_from_unpaid_sessions"
    echo "  generate_payment_reminder_token"
    echo ""
    echo "Examples:"
    echo "  $0 get_all_players_payment_summary '{}'"
    echo "  $0 validate_payment_token '{\"p_token\":\"uuid-here\"}'"
    exit 1
fi

# Make the RPC call
echo "⚡ Calling RPC: ${FUNCTION_NAME}" >&2
echo "📦 Params: ${PARAMS}" >&2
echo "" >&2

RESULT=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/${FUNCTION_NAME}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "${PARAMS}")

# Pretty print if jq is available, otherwise raw output
if command -v jq &> /dev/null; then
    echo "$RESULT" | jq '.'
else
    echo "$RESULT"
fi

echo "" >&2
