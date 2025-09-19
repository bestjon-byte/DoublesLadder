#!/usr/bin/env python3
"""
ELO Calculator Helper - Calculate ELO changes for Winter 25 matches
"""

import math

def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    """Calculate expected score using ELO formula"""
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400))

def update_elo(old_rating: float, actual_score: float, expected_score: float, k_factor: int = 32) -> float:
    """Update ELO rating based on match result"""
    return old_rating + k_factor * (actual_score - expected_score)

# Current ELO ratings
players = {
    'cb3c3050-19a6-4f39-b7bf-f218c73964c4': {'name': 'Ben', 'elo': 1110, 'season_player_id': '0babd282-5efb-4360-8e0c-a84739bc1124'},
    '2447e434-4cfd-4cde-8587-e90f5b9bc402': {'name': 'Bev', 'elo': 1070, 'season_player_id': '40d28b67-7984-404a-b170-3a69aa58a300'},
    'c43d2d40-0e50-4059-90c5-ff4d6b3af11f': {'name': 'Charlie Meacham', 'elo': 1150, 'season_player_id': '0c5aeb1f-d873-4ca4-a90c-f738d09c928c'},
    '3c18cf9c-8ded-4744-8e11-cabbaa332964': {'name': 'Dave', 'elo': 1130, 'season_player_id': 'd5458d46-044b-4165-8767-b342c5be717c'},
    '6c429cca-53a9-436d-8985-c39c523b4f9d': {'name': 'Dave M', 'elo': 1180, 'season_player_id': '9c82cd8f-6a69-477c-b0b1-5b25115cef0d'},
    '1d2cc410-a11f-47c0-89b4-da8ff8a55677': {'name': 'James', 'elo': 1120, 'season_player_id': '4e63bf69-73e0-40c4-85f8-843ca9de2bd6'},
    'abd3b97c-11eb-4ced-a0c4-3bdb6fd200b8': {'name': 'Jason', 'elo': 1100, 'season_player_id': 'bd1183d6-d44b-4cee-8ca1-b0870fb49f59'},
    '4dfcd8c8-0576-4cce-ba6f-685cf823dbdf': {'name': 'Joanne', 'elo': 1080, 'season_player_id': '5a737474-de73-4ef9-adfc-23c71f7ceff3'},
    'ac4150e6-7b01-4617-9bd9-ddd03b5225da': {'name': 'Jon Best', 'elo': 1100, 'season_player_id': '35e1d29c-f470-4ee1-93d7-20bd8053399e'},
    'e5bc3719-863b-4e02-87fb-1349d1627cc3': {'name': 'Julie', 'elo': 1080, 'season_player_id': '27c23577-c826-4397-997f-fc210d2dc47c'},
    '5e53d15f-8e5a-4d1e-b83e-11346f17ebe7': {'name': 'Liz', 'elo': 1080, 'season_player_id': '36c593f3-ff52-4eb4-8732-5b884232a060'},
    'd2c3ae59-00f8-4b47-919e-830d45c01fae': {'name': 'Mark A', 'elo': 1080, 'season_player_id': '557e686f-b0aa-4e3d-9275-6a6d53bbd555'},
    'a9d2acf3-a7c3-4d55-bd38-f14debf248c5': {'name': 'Mark B', 'elo': 1070, 'season_player_id': 'c3c914a7-4002-4eb6-860e-0afea2011525'},
    'c5e91d1f-02de-4c71-88bc-9473060c68fd': {'name': 'Michael Brennan', 'elo': 1110, 'season_player_id': '65c505b1-ed17-48a5-b927-776e4cb2b8f7'},
    'abc931be-0bd9-4a88-8382-9bab512c350c': {'name': 'Oxy', 'elo': 1090, 'season_player_id': '20c7c54b-06b8-4a8e-b943-4a3851ac1601'},
    'b456cc6f-a808-46dd-94e2-dd0817147501': {'name': 'Samuel Best', 'elo': 1070, 'season_player_id': '685ecc61-61b2-4c23-98a2-a6863c09296a'},
    '6746ee61-7f92-4f57-9d8d-1423269addbc': {'name': 'Shelagh', 'elo': 1080, 'season_player_id': 'b0c06543-6dac-4715-b80e-097265d14b3f'},
    'd871d3b7-2f2e-4218-b5ed-b3492155c6cd': {'name': 'Sid Abraham', 'elo': 1190, 'season_player_id': '533e50ea-4ba3-4320-af76-0382e3f67f15'},
    '5f4107b3-a5da-4faf-9b48-649652cf4ba4': {'name': 'Stephen P', 'elo': 1110, 'season_player_id': '7b0af044-52a0-4e7c-a250-859d46ab0c29'},
    'd893c985-a1f7-4183-a5e5-0a981579c4da': {'name': 'Steve C', 'elo': 1070, 'season_player_id': '695d260a-b608-48e9-a232-0f3946165528'},
    '195aa25e-1ce4-4de9-99c7-17253ed45d9a': {'name': 'Tim', 'elo': 1120, 'season_player_id': '87de9fe5-806f-4a60-85f2-b12a9e5df53d'},
}

def process_match(fixture_id, pair1_ids, pair2_ids, pair1_score, pair2_score, created_at, week):
    """Process a match and generate SQL for ELO updates"""
    
    # Get current ELO ratings
    pair1_elos = [players[pid]['elo'] for pid in pair1_ids]
    pair2_elos = [players[pid]['elo'] for pid in pair2_ids]
    
    pair1_avg = sum(pair1_elos) / 2
    pair2_avg = sum(pair2_elos) / 2
    
    # Calculate expected scores
    pair1_expected = calculate_expected_score(pair1_avg, pair2_avg)
    pair2_expected = 1.0 - pair1_expected
    
    # Calculate actual scores
    total_games = pair1_score + pair2_score
    pair1_actual = pair1_score / total_games if total_games > 0 else 0.5
    pair2_actual = pair2_score / total_games if total_games > 0 else 0.5
    
    print(f"\n=== Match: Week {week} ===")
    print(f"Fixture ID: {fixture_id}")
    print(f"Pair 1: {[players[pid]['name'] for pid in pair1_ids]} (Avg ELO: {pair1_avg:.0f})")
    print(f"Pair 2: {[players[pid]['name'] for pid in pair2_ids]} (Avg ELO: {pair2_avg:.0f})")
    print(f"Score: {pair1_score}-{pair2_score}")
    print(f"Expected: {pair1_expected:.3f} vs {pair2_expected:.3f}")
    print(f"Actual: {pair1_actual:.3f} vs {pair2_actual:.3f}")
    print()
    
    # Generate SQL statements
    sql_statements = []
    
    # Process pair 1 players
    for i, player_id in enumerate(pair1_ids):
        old_elo = players[player_id]['elo']
        new_elo = update_elo(old_elo, pair1_actual, pair1_expected)
        rating_change = new_elo - old_elo
        season_player_id = players[player_id]['season_player_id']
        
        # Update the player's ELO for next calculation
        players[player_id]['elo'] = new_elo
        
        # Create ELO history insert
        sql = f"""
INSERT INTO elo_history (
    season_player_id, match_fixture_id, old_rating, new_rating, 
    rating_change, k_factor, opponent_avg_rating, expected_score, 
    actual_score, created_at
) VALUES (
    '{season_player_id}', '{fixture_id}', {int(old_elo)}, {int(new_elo)}, 
    {int(rating_change)}, 32, {int(pair2_avg)}, {pair1_expected:.6f}, 
    {pair1_actual:.6f}, '{created_at}'
);"""
        sql_statements.append(sql)
        
        print(f"{players[player_id]['name']}: {old_elo:.0f} → {new_elo:.0f} ({rating_change:+.0f})")
    
    # Process pair 2 players
    for i, player_id in enumerate(pair2_ids):
        old_elo = players[player_id]['elo']
        new_elo = update_elo(old_elo, pair2_actual, pair2_expected)
        rating_change = new_elo - old_elo
        season_player_id = players[player_id]['season_player_id']
        
        # Update the player's ELO for next calculation
        players[player_id]['elo'] = new_elo
        
        # Create ELO history insert
        sql = f"""
INSERT INTO elo_history (
    season_player_id, match_fixture_id, old_rating, new_rating, 
    rating_change, k_factor, opponent_avg_rating, expected_score, 
    actual_score, created_at
) VALUES (
    '{season_player_id}', '{fixture_id}', {int(old_elo)}, {int(new_elo)}, 
    {int(rating_change)}, 32, {int(pair1_avg)}, {pair2_expected:.6f}, 
    {pair2_actual:.6f}, '{created_at}'
);"""
        sql_statements.append(sql)
        
        print(f"{players[player_id]['name']}: {old_elo:.0f} → {new_elo:.0f} ({rating_change:+.0f})")
    
    return sql_statements

# Process first match
match1_sql = process_match(
    '974a4908-0917-4938-965f-7d9e3958f492',
    ['c43d2d40-0e50-4059-90c5-ff4d6b3af11f', 'abc931be-0bd9-4a88-8382-9bab512c350c'],  # Charlie + Oxy
    ['1d2cc410-a11f-47c0-89b4-da8ff8a55677', 'cb3c3050-19a6-4f39-b7bf-f218c73964c4'],  # James + Ben
    4, 4, '2025-09-01 07:08:18.698302+00', 1
)

print("SQL to execute:")
for sql in match1_sql:
    print(sql)