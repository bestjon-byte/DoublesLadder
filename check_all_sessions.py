#!/usr/bin/env python3
"""
Check all coaching sessions in the database
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
    print("🔍 Checking all coaching sessions...")
    print("-" * 60)

    # Get all sessions
    all_sessions = supabase.table('coaching_sessions') \
        .select('id, session_date, session_type, session_time, status') \
        .order('session_date') \
        .execute()

    if not all_sessions.data:
        print("❌ No coaching sessions found at all")
        return

    print(f"Found {len(all_sessions.data)} total session(s):\n")

    # Group by type
    by_type = {}
    for session in all_sessions.data:
        session_type = session['session_type']
        if session_type not in by_type:
            by_type[session_type] = []
        by_type[session_type].append(session)

    for session_type, sessions in by_type.items():
        print(f"\n📊 {session_type} Sessions ({len(sessions)}):")
        print("-" * 60)

        for session in sessions:
            print(f"📅 {session['session_date']} at {session['session_time']} ({session['status']})")

            # Get attendance
            attendance = supabase.table('coaching_attendance') \
                .select('id, player_id, profiles(name, email)') \
                .eq('session_id', session['id']) \
                .execute()

            if attendance.data:
                print(f"   Attendees ({len(attendance.data)}):")
                for att in attendance.data:
                    if att['profiles']:
                        name = att['profiles']['name']
                        # Highlight Liz
                        if 'liz' in name.lower():
                            print(f"      ⭐ {name} ({att['profiles']['email']})")
                        else:
                            print(f"      - {name}")
            else:
                print(f"   No attendees")

    # Summary
    print("\n\n📊 Summary:")
    print("-" * 60)
    for session_type, sessions in by_type.items():
        print(f"  {session_type}: {len(sessions)} sessions")

if __name__ == '__main__':
    main()
