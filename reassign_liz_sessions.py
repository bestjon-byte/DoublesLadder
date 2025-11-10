#!/usr/bin/env python3
"""
Reassign coaching sessions from Liz Myers to Liz profile
"""

import os
import sys

# Check if supabase is installed
try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase-py not installed")
    print("Install with: pip3 install supabase")
    sys.exit(1)

# Get Supabase credentials from environment
SUPABASE_URL = os.environ.get('REACT_APP_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('REACT_APP_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials")
    print("Make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("🔍 Finding Liz profiles...")
    print("-" * 60)

    # Step 1: Find both profiles
    response = supabase.table('profiles').select('id, name, email').ilike('name', '%liz%').execute()

    if not response.data:
        print("❌ No profiles found with 'Liz' in the name")
        sys.exit(1)

    print(f"Found {len(response.data)} profile(s):")
    for profile in response.data:
        print(f"  - {profile['name']} ({profile['email']}) [ID: {profile['id']}]")

    # Find the specific profiles
    liz_myers = None
    liz_new = None

    for profile in response.data:
        if profile['name'] == 'Liz Myers':
            liz_myers = profile
        elif profile['name'] == 'Liz':
            liz_new = profile

    if not liz_myers:
        print("\n❌ Could not find 'Liz Myers' profile")
        sys.exit(1)

    if not liz_new:
        print("\n❌ Could not find 'Liz' profile")
        sys.exit(1)

    print(f"\n✅ Found Liz Myers: {liz_myers['id']}")
    print(f"✅ Found Liz: {liz_new['id']}")

    # Step 2: Find coaching sessions for Liz Myers (Beginners only)
    print(f"\n🔍 Finding beginner coaching sessions for Liz Myers...")
    print("-" * 60)

    attendance_response = supabase.table('coaching_attendance') \
        .select('id, session_id, coaching_sessions(session_date, session_type, session_time)') \
        .eq('player_id', liz_myers['id']) \
        .execute()

    if not attendance_response.data:
        print("❌ No coaching sessions found for Liz Myers")
        sys.exit(1)

    # Filter for Beginners sessions
    beginner_sessions = [
        att for att in attendance_response.data
        if att['coaching_sessions'] and att['coaching_sessions']['session_type'] == 'Beginners'
    ]

    print(f"Found {len(beginner_sessions)} beginner session(s):")
    for att in beginner_sessions:
        session = att['coaching_sessions']
        print(f"  - {session['session_date']} at {session['session_time']} ({session['session_type']})")

    if len(beginner_sessions) == 0:
        print("\n❌ No beginner sessions found to reassign")
        sys.exit(1)

    # Step 3: Confirm update
    print(f"\n⚠️  About to reassign {len(beginner_sessions)} session(s) from 'Liz Myers' to 'Liz'")
    confirm = input("Continue? (yes/no): ")

    if confirm.lower() != 'yes':
        print("❌ Cancelled")
        sys.exit(0)

    # Step 4: Update the records
    print(f"\n📝 Updating coaching_attendance records...")
    print("-" * 60)

    success_count = 0
    error_count = 0

    for att in beginner_sessions:
        try:
            supabase.table('coaching_attendance') \
                .update({'player_id': liz_new['id']}) \
                .eq('id', att['id']) \
                .execute()

            session = att['coaching_sessions']
            print(f"  ✅ Updated: {session['session_date']} at {session['session_time']}")
            success_count += 1
        except Exception as e:
            print(f"  ❌ Error updating {att['id']}: {e}")
            error_count += 1

    # Step 5: Verify
    print(f"\n✅ Update complete!")
    print(f"  - Successfully updated: {success_count}")
    print(f"  - Errors: {error_count}")

    # Verify the new assignments
    print(f"\n🔍 Verifying new assignments for Liz...")
    print("-" * 60)

    verify_response = supabase.table('coaching_attendance') \
        .select('id, session_id, coaching_sessions(session_date, session_type, session_time)') \
        .eq('player_id', liz_new['id']) \
        .execute()

    liz_beginner_sessions = [
        att for att in verify_response.data
        if att['coaching_sessions'] and att['coaching_sessions']['session_type'] == 'Beginners'
    ]

    print(f"Liz now has {len(liz_beginner_sessions)} beginner session(s):")
    for att in liz_beginner_sessions:
        session = att['coaching_sessions']
        print(f"  - {session['session_date']} at {session['session_time']} ({session['session_type']})")

    print("\n✅ Done!")

if __name__ == '__main__':
    main()
