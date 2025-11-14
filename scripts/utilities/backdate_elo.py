#!/usr/bin/env python3
"""
Backdate ELO calculations for Winter 25 season
This script processes all match results in chronological order and creates ELO history records
"""

import json
import math
import psycopg2
from datetime import datetime
from typing import Dict, List, Tuple

# Database connection details - UPDATE THESE WITH YOUR SUPABASE DETAILS
DB_CONFIG = {
    'host': 'YOUR_SUPABASE_PROJECT_URL',  # e.g., 'abc123.supabase.co'
    'database': 'postgres',
    'user': 'postgres',
    'password': 'YOUR_SUPABASE_PASSWORD',
    'port': '5432'
}

# Alternative: Use Supabase connection string (easier)
# Just uncomment and update this line instead of the DB_CONFIG above:
# CONNECTION_STRING = "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"

WINTER_25_SEASON_ID = 'e45aade8-c31f-40e6-834e-a125a078fcff'

def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    """Calculate expected score using ELO formula"""
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400))

def update_elo(old_rating: float, actual_score: float, expected_score: float, k_factor: int = 32) -> float:
    """Update ELO rating based on match result"""
    return old_rating + k_factor * (actual_score - expected_score)

def backdate_elo_for_season():
    """Main function to backdate ELO for Winter 25 season"""
    
    try:
        # Connect to database
        # Try connection string first, then fall back to DB_CONFIG
        try:
            if 'CONNECTION_STRING' in globals():
                conn = psycopg2.connect(CONNECTION_STRING)
            else:
                conn = psycopg2.connect(**DB_CONFIG)
        except Exception as conn_error:
            print(f"❌ Connection failed: {conn_error}")
            print("\n💡 Quick Setup:")
            print("1. Get your Supabase connection details from: Project Settings > Database")
            print("2. Update the CONNECTION_STRING variable in this script")
            print("3. Install psycopg2: pip install psycopg2-binary")
            return
            
        cur = conn.cursor()
        
        print("Connected to database successfully")
        
        # 1. Clear existing ELO history for this season
        print("Clearing existing ELO history...")
        cur.execute("""
            DELETE FROM elo_history 
            WHERE season_player_id IN (
                SELECT id FROM season_players 
                WHERE season_id = %s
            )
        """, (WINTER_25_SEASON_ID,))
        
        # 2. Get all season players with their starting ELO ratings
        print("Getting season players...")
        cur.execute("""
            SELECT sp.id, sp.player_id, p.name, sp.elo_rating as starting_elo
            FROM season_players sp
            JOIN profiles p ON sp.player_id = p.id
            WHERE sp.season_id = %s
            ORDER BY p.name
        """, (WINTER_25_SEASON_ID,))
        
        season_players = cur.fetchall()
        
        # Create lookup dictionaries
        player_id_to_season_player = {row[1]: row[0] for row in season_players}  # player_id -> season_player_id
        current_ratings = {row[1]: float(row[3]) for row in season_players}  # player_id -> current_rating
        
        print(f"Found {len(season_players)} season players")
        
        # 3. Get all match fixtures with results, ordered chronologically
        print("Getting match results in chronological order...")
        cur.execute("""
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
            WHERE m.season_id = %s
            ORDER BY mr.created_at, mf.id
        """, (WINTER_25_SEASON_ID,))
        
        match_results = cur.fetchall()
        print(f"Found {len(match_results)} match results to process")
        
        # 4. Process each match result and update ELO
        for i, match in enumerate(match_results):
            fixture_id, p1p1_id, p1p2_id, p2p1_id, p2p2_id, pair1_score, pair2_score, created_at, week = match
            
            # Skip matches with missing players
            if not all([p1p1_id, p1p2_id, p2p1_id, p2p2_id]):
                print(f"Skipping fixture {fixture_id} - missing player IDs")
                continue
                
            # Skip if any players not in season
            pair1_players = [p1p1_id, p1p2_id]
            pair2_players = [p2p1_id, p2p2_id]
            
            if not all(pid in current_ratings for pid in pair1_players + pair2_players):
                print(f"Skipping fixture {fixture_id} - players not in season")
                continue
            
            print(f"Processing match {i+1}/{len(match_results)}: Week {week}, Fixture {fixture_id}")
            
            # Calculate pair average ratings
            pair1_avg = sum(current_ratings[pid] for pid in pair1_players) / 2
            pair2_avg = sum(current_ratings[pid] for pid in pair2_players) / 2
            
            # Calculate expected scores
            pair1_expected = calculate_expected_score(pair1_avg, pair2_avg)
            pair2_expected = 1.0 - pair1_expected
            
            # Calculate actual scores (normalized to 0-1)
            total_games = pair1_score + pair2_score
            if total_games > 0:
                pair1_actual = pair1_score / total_games
                pair2_actual = pair2_score / total_games
            else:
                pair1_actual = 0.5  # Draw
                pair2_actual = 0.5
            
            # Update ratings and create history records for each player
            for player_id in pair1_players:
                old_rating = current_ratings[player_id]
                new_rating = update_elo(old_rating, pair1_actual, pair1_expected)
                rating_change = new_rating - old_rating
                season_player_id = player_id_to_season_player[player_id]
                
                # Insert ELO history record
                cur.execute("""
                    INSERT INTO elo_history (
                        season_player_id,
                        match_fixture_id,
                        old_rating,
                        new_rating,
                        rating_change,
                        k_factor,
                        opponent_avg_rating,
                        expected_score,
                        actual_score,
                        created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    season_player_id,
                    fixture_id,
                    int(old_rating),
                    int(new_rating),
                    int(rating_change),
                    32,
                    int(pair2_avg),
                    pair1_expected,
                    pair1_actual,
                    created_at
                ))
                
                current_ratings[player_id] = new_rating
            
            for player_id in pair2_players:
                old_rating = current_ratings[player_id]
                new_rating = update_elo(old_rating, pair2_actual, pair2_expected)
                rating_change = new_rating - old_rating
                season_player_id = player_id_to_season_player[player_id]
                
                # Insert ELO history record
                cur.execute("""
                    INSERT INTO elo_history (
                        season_player_id,
                        match_fixture_id,
                        old_rating,
                        new_rating,
                        rating_change,
                        k_factor,
                        opponent_avg_rating,
                        expected_score,
                        actual_score,
                        created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    season_player_id,
                    fixture_id,
                    int(old_rating),
                    int(new_rating),
                    int(rating_change),
                    32,
                    int(pair1_avg),
                    pair2_expected,
                    pair2_actual,
                    created_at
                ))
                
                current_ratings[player_id] = new_rating
        
        # 5. Update final ELO ratings in season_players table
        print("Updating final ELO ratings...")
        for player_id, final_rating in current_ratings.items():
            season_player_id = player_id_to_season_player[player_id]
            cur.execute("""
                UPDATE season_players 
                SET elo_rating = %s 
                WHERE id = %s
            """, (int(final_rating), season_player_id))
        
        # Commit all changes
        conn.commit()
        print("✅ ELO backdating completed successfully!")
        
        # Show final ratings
        print("\n=== Final ELO Ratings ===")
        cur.execute("""
            SELECT p.name, sp.elo_rating
            FROM season_players sp
            JOIN profiles p ON sp.player_id = p.id
            WHERE sp.season_id = %s
            ORDER BY sp.elo_rating DESC
        """, (WINTER_25_SEASON_ID,))
        
        final_ratings = cur.fetchall()
        for i, (name, rating) in enumerate(final_ratings, 1):
            print(f"{i:2d}. {name:<20} {rating}")
        
        # Show ELO history count
        cur.execute("""
            SELECT COUNT(*) FROM elo_history 
            WHERE season_player_id IN (
                SELECT id FROM season_players WHERE season_id = %s
            )
        """, (WINTER_25_SEASON_ID,))
        
        history_count = cur.fetchone()[0]
        print(f"\n📊 Created {history_count} ELO history records")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🎾 ELO Backdating Script for Winter 25 Season")
    print("=" * 50)
    
    # Note: You'll need to update DB_CONFIG with your actual Supabase connection details
    print("⚠️  Please update DB_CONFIG with your Supabase connection details before running")
    print("📋 This script will:")
    print("   1. Clear existing ELO history for Winter 25")
    print("   2. Process all match results in chronological order")
    print("   3. Create ELO history records for each match")
    print("   4. Update final ELO ratings")
    print()
    
    response = input("Continue? (y/N): ")
    if response.lower() == 'y':
        backdate_elo_for_season()
    else:
        print("Cancelled")