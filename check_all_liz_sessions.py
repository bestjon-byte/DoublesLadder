#!/usr/bin/env python3
"""
Check all coaching sessions for both Liz profiles
"""

import os
import sys

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase-py not installed")
    sys.exit(1)

SUPABASE_URL = os.environ.get('REACT_APP_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('REACT_APP_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("🔍 Finding all Liz profiles...")
    print("-" * 60)

    # Find all Liz profiles
    response = supabase.table('profiles').select('id, name, email').ilike('name', '%liz%').execute()

    print(f"Found {len(response.data)} profile(s):")
    for profile in response.data:
        print(f"\n📋 Profile: {profile['name']} ({profile['email']})")
        print(f"   ID: {profile['id']}")

        # Get all attendance records for this profile
        attendance = supabase.table('coaching_attendance') \
            .select('id, session_id, self_registered, created_at') \
            .eq('player_id', profile['id']) \
            .execute()

        if attendance.data:
            print(f"   ✅ Has {len(attendance.data)} attendance record(s)")

            # Get session details for each attendance
            for att in attendance.data:
                session = supabase.table('coaching_sessions') \
                    .select('session_date, session_type, session_time, status') \
                    .eq('id', att['session_id']) \
                    .single() \
                    .execute()

                if session.data:
                    s = session.data
                    print(f"      → {s['session_date']} at {s['session_time']} - {s['session_type']} ({s['status']})")
        else:
            print(f"   ❌ No attendance records found")

    # Also check all beginner sessions to see who's assigned
    print("\n\n🔍 Checking all Beginner coaching sessions...")
    print("-" * 60)

    all_sessions = supabase.table('coaching_sessions') \
        .select('id, session_date, session_type, session_time') \
        .eq('session_type', 'Beginners') \
        .order('session_date') \
        .execute()

    if all_sessions.data:
        print(f"Found {len(all_sessions.data)} Beginner session(s):")

        for session in all_sessions.data:
            print(f"\n📅 {session['session_date']} at {session['session_time']}")

            # Get attendance for this session
            attendance = supabase.table('coaching_attendance') \
                .select('id, player_id, profiles(name, email)') \
                .eq('session_id', session['id']) \
                .execute()

            if attendance.data:
                print(f"   Attendees ({len(attendance.data)}):")
                for att in attendance.data:
                    if att['profiles']:
                        print(f"      - {att['profiles']['name']} ({att['profiles']['email']})")
            else:
                print(f"   No attendees")
    else:
        print("❌ No Beginner sessions found")

if __name__ == '__main__':
    main()
