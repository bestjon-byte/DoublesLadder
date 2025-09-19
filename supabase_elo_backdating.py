#!/usr/bin/env python3
"""
ELO Backdating using Supabase MCP Tools
This approach uses the existing Supabase connection instead of psycopg2
"""

import math
import json
from typing import Dict, List, Tuple

WINTER_25_SEASON_ID = 'e45aade8-c31f-40e6-834e-a125a078fcff'

def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    """Calculate expected score using ELO formula"""
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400))

def update_elo(old_rating: float, actual_score: float, expected_score: float, k_factor: int = 32) -> float:
    """Update ELO rating based on match result"""
    return old_rating + k_factor * (actual_score - expected_score)

def print_sql_for_manual_execution():
    """Generate SQL statements that can be run manually via Claude's MCP tools"""
    
    print("🎾 ELO BACKDATING SQL GENERATOR")
    print("=" * 50)
    print("Copy and paste these SQL statements one by one using Claude's MCP tools:")
    print()
    
    # Step 1: Clear existing ELO history
    print("-- Step 1: Clear existing ELO history")
    print(f"""
DELETE FROM elo_history 
WHERE season_player_id IN (
    SELECT id FROM season_players 
    WHERE season_id = '{WINTER_25_SEASON_ID}'
);
""")
    
    # We'll need to generate the ELO calculations based on match results
    # Since we can't connect directly, let's provide the logic structure
    
    print("\n-- Step 2: Get match results in order")
    print(f"""
SELECT 
    mf.id as fixture_id,
    mf.pair1_player1_id,
    mf.pair1_player2_id,
    mf.pair2_player1_id,
    mf.pair2_player2_id,
    mr.pair1_score,
    mr.pair2_score,
    mr.created_at,
    m.week_number
FROM match_fixtures mf
JOIN matches m ON mf.match_id = m.id
JOIN match_results mr ON mf.id = mr.fixture_id
WHERE m.season_id = '{WINTER_25_SEASON_ID}'
    AND mf.pair1_player1_id IS NOT NULL
    AND mf.pair1_player2_id IS NOT NULL
    AND mf.pair2_player1_id IS NOT NULL
    AND mf.pair2_player2_id IS NOT NULL
ORDER BY mr.created_at, mf.id;
""")

    print("\n📋 MANUAL PROCESS:")
    print("1. Run the DELETE statement above using Claude's MCP tools")
    print("2. Run the SELECT statement to get match results")
    print("3. Use Claude to process each match and generate ELO update statements")
    print("4. This will create the complete ELO history for Winter 25")

def main():
    print_sql_for_manual_execution()

if __name__ == "__main__":
    main()