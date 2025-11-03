#!/usr/bin/env python3
import urllib.request
import json

SUPABASE_URL = "https://hwpjrkmplydqaxiikupv.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGpya21wbHlkcWF4aWlrdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTUwNjgsImV4cCI6MjA3MTA5MTA2OH0.6xnC3k_CRChyavAfdJT0I4NLN_Wv1ZgIlRO0Jnqckkk"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
}

season_id = "e96b68d8-dfcd-4999-92ee-3b28c1372260"

# Get all season players with games played
req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/season_players?season_id=eq.{season_id}&games_played=gt.0&select=id,player_id,elo_rating,games_played",
    headers=headers
)
season_players = json.loads(urllib.request.urlopen(req).read())

print(f"Found {len(season_players)} players with games played\n")

improvements = []

for sp in season_players:
    # Get first ELO entry for this player
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/elo_history?season_player_id=eq.{sp['id']}&select=old_rating,created_at&order=created_at.asc&limit=1",
        headers=headers
    )
    try:
        first_elo = json.loads(urllib.request.urlopen(req).read())
        if first_elo:
            starting_elo = first_elo[0]['old_rating']
        else:
            starting_elo = 1200  # Default
    except:
        starting_elo = 1200

    # Get player name
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{sp['player_id']}&select=name",
        headers=headers
    )
    player_data = json.loads(urllib.request.urlopen(req).read())
    player_name = player_data[0]['name'] if player_data else "Unknown"

    current_elo = sp['elo_rating'] or 1200
    improvement = current_elo - starting_elo

    improvements.append({
        'name': player_name,
        'starting': starting_elo,
        'current': current_elo,
        'improvement': improvement,
        'games': sp['games_played']
    })

# Sort by improvement descending
improvements.sort(key=lambda x: x['improvement'], reverse=True)

print("=" * 80)
print("TOP 10 MOST IMPROVED PLAYERS (by ELO change from first match)")
print("=" * 80)
print(f"{'Rank':<6} {'Player':<25} {'Start':<8} {'Current':<8} {'Change':<10} {'Games'}")
print("-" * 80)

for i, player in enumerate(improvements[:10], 1):
    print(f"{i:<6} {player['name']:<25} {player['starting']:<8} {player['current']:<8} {player['improvement']:+10.0f} {player['games']}")

print("\n" + "=" * 80)
print("BOTTOM 5 (Most Declined)")
print("=" * 80)
for i, player in enumerate(improvements[-5:], 1):
    print(f"{player['name']:<25} {player['starting']:<8} {player['current']:<8} {player['improvement']:+10.0f}")
