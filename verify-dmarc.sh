#!/bin/bash
# Script to verify DMARC record is configured correctly

echo "Checking DMARC record for cawoodtennisclub.co.uk..."
echo ""

# Check DMARC record
echo "=== DMARC Record ==="
dmarc_record=$(dig TXT _dmarc.cawoodtennisclub.co.uk +short)

if [ -z "$dmarc_record" ]; then
    echo "❌ No DMARC record found"
    echo ""
    echo "Wait 24-48 hours after adding the record in Cloudflare."
    echo "DNS propagation can take time."
else
    echo "✅ DMARC record found:"
    echo "$dmarc_record"
    echo ""

    # Check if it contains required fields
    if echo "$dmarc_record" | grep -q "v=DMARC1"; then
        echo "✅ Valid DMARC version"
    else
        echo "⚠️  Missing or invalid DMARC version"
    fi

    if echo "$dmarc_record" | grep -q "p="; then
        policy=$(echo "$dmarc_record" | grep -o 'p=[^;]*')
        echo "✅ Policy configured: $policy"
    else
        echo "⚠️  No policy specified"
    fi

    if echo "$dmarc_record" | grep -q "rua="; then
        reporting=$(echo "$dmarc_record" | grep -o 'rua=[^;]*')
        echo "✅ Reporting configured: $reporting"
    else
        echo "⚠️  No reporting address configured"
    fi
fi

echo ""
echo "=== SPF Record ==="
spf_record=$(dig TXT cawoodtennisclub.co.uk +short | grep "v=spf1")

if [ -z "$spf_record" ]; then
    echo "⚠️  No SPF record found (but Resend says it's configured)"
else
    echo "✅ SPF record found:"
    echo "$spf_record"
fi

echo ""
echo "=== Next Steps ==="
if [ -z "$dmarc_record" ]; then
    echo "1. Add DMARC record in Cloudflare (see instructions)"
    echo "2. Wait 24-48 hours"
    echo "3. Run this script again to verify"
else
    echo "1. Send test emails from your app"
    echo "2. Check if they arrive in inbox (not spam)"
    echo "3. After 1-2 weeks, upgrade policy to p=quarantine"
fi

echo ""
echo "Online verification: https://mxtoolbox.com/dmarc.aspx"
