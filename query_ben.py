#!/usr/bin/env python3
import requests
import json
import sys

# Supabase credentials
SUPABASE_URL = "https://hwpjrkmplydqaxiikupv.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGpya21wbHlkcWF4aWlrdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTUwNjgsImV4cCI6MjA3MTA5MTA2OH0.6xnC3k_CRChyavAfdJT0I4NLN_Wv1ZgIlRO0Jnqckkk"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("PROFILES with 'Ben' or 'Drummond' in name:")
print("=" * 80)
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/profiles?or=(name.ilike.*ben*,name.ilike.*drummond*)&select=id,name,email,auth_user_id,merged_into_player_id,is_merged,status",
    headers=headers
)
profiles = response.json()
for profile in profiles:
    print(json.dumps(profile, indent=2))
    print("-" * 40)

print("\n" + "=" * 80)
print("SEASON_PLAYERS records for Ben profiles:")
print("=" * 80)
for profile in profiles:
    print(f"\nSeason players for {profile['name']} (ID: {profile['id']}):")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/season_players?player_id=eq.{profile['id']}&select=season_id,games_played,games_won,matches_played,matches_won,elo_rating,seasons(name,season_type,status)",
        headers=headers
    )
    season_players = response.json()
    if season_players:
        for sp in season_players:
            print(json.dumps(sp, indent=2))
    else:
        print("  No season_players records found")
    print("-" * 40)

print("\n" + "=" * 80)
print("CURRENT SEASON INFO:")
print("=" * 80)
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/seasons?status=eq.active&select=id,name,season_type,status",
    headers=headers
)
seasons = response.json()
print(json.dumps(seasons, indent=2))
