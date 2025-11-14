#!/usr/bin/env python3
"""
ELO Simulation for Winter 25 Season
Compares two different starting ELO scenarios
"""

import math
from typing import Dict, List, Tuple
from datetime import datetime

# Starting ELO values from user's request
STARTING_ELO_1 = {
    "Sid Abraham": 1400,
    "Jason": 1100,
    "Ben": 1200,
    "Tim": 1200,
    "Michael Brennan": 1150,
    "Dave": 1300,
    "Charlie Meacham": 1300,
    "Stephen P": 1100,
    "Dave M": 1350,
    "Jon Best": 1100,  # Note: stored as "Jon" in database
    "James": 1150,
    "Mark A": 1050,
    "Oxy": 1100,
    "Julie": 1000,
    "Mark B": 1000,
    "Shelagh": 900,
    "Joanne": 900,
    "Steve C": 900,
    "Bev": 900,
    "Liz": 1000,
    "Samuel Best": 900
}

STARTING_ELO_2 = {
    "Sid Abraham": 1200,
    "Jason": 1100,
    "Ben": 1110,
    "Tim": 1120,
    "Michael Brennan": 1110,
    "Dave": 1130,
    "Charlie Meacham": 1150,
    "Stephen P": 1110,
    "Dave M": 1180,
    "Jon Best": 1100,
    "James": 1120,
    "Mark A": 1080,
    "Oxy": 1090,
    "Julie": 1080,
    "Mark B": 1070,
    "Shelagh": 1080,
    "Joanne": 1080,
    "Steve C": 1070,
    "Bev": 1070,
    "Liz": 1080,
    "Samuel Best": 1070
}

# Name mapping for database inconsistencies
NAME_MAPPING = {
    "Sid Abraham ": "Sid Abraham",  # Remove trailing space
    "Jon": "Jon Best",  # Map Jon to Jon Best
}

# Match results data from database
MATCH_RESULTS = [
    # Week 1
    {"week": 1, "pair1": ["Michael Brennan", "Bev"], "pair2": ["Jon", "Shelagh"], "pair1_score": 5, "pair2_score": 3},
    {"week": 1, "pair1": ["Michael Brennan", "Shelagh"], "pair2": ["Jon", "Bev"], "pair1_score": 7, "pair2_score": 1},
    {"week": 1, "pair1": ["Michael Brennan", "Jon"], "pair2": ["Shelagh", "Bev"], "pair1_score": 8, "pair2_score": 0},
    {"week": 1, "pair1": ["Charlie Meacham", "Oxy"], "pair2": ["James", "Ben"], "pair1_score": 4, "pair2_score": 4},
    {"week": 1, "pair1": ["Charlie Meacham", "Ben"], "pair2": ["James", "Oxy"], "pair1_score": 6, "pair2_score": 2},
    {"week": 1, "pair1": ["Charlie Meacham", "James"], "pair2": ["Ben", "Oxy"], "pair1_score": 6, "pair2_score": 2},
    
    # Week 2
    {"week": 2, "pair1": ["James", "Stephen P"], "pair2": ["Ben", "Sid Abraham"], "pair1_score": 2, "pair2_score": 8},
    {"week": 2, "pair1": ["James", "Sid Abraham"], "pair2": ["Ben", "Stephen P"], "pair1_score": 9, "pair2_score": 1},
    {"week": 2, "pair1": ["James", "Ben"], "pair2": ["Sid Abraham", "Stephen P"], "pair1_score": 4, "pair2_score": 6},
    {"week": 2, "pair1": ["Joanne", "Bev"], "pair2": ["Shelagh", "Oxy"], "pair1_score": 1, "pair2_score": 9},
    {"week": 2, "pair1": ["Joanne", "Oxy"], "pair2": ["Shelagh", "Bev"], "pair1_score": 9, "pair2_score": 1},
    {"week": 2, "pair1": ["Joanne", "Shelagh"], "pair2": ["Oxy", "Bev"], "pair1_score": 2, "pair2_score": 8},
    {"week": 2, "pair1": ["Mark A", "Julie"], "pair2": ["Mark B", "Steve C"], "pair1_score": 6, "pair2_score": 4},
    {"week": 2, "pair1": ["Mark A", "Steve C"], "pair2": ["Mark B", "Julie"], "pair1_score": 3, "pair2_score": 7},
    {"week": 2, "pair1": ["Mark A", "Mark B"], "pair2": ["Steve C", "Julie"], "pair1_score": 8, "pair2_score": 2},
    
    # Week 3
    {"week": 3, "pair1": ["Michael Brennan", "Dave"], "pair2": ["Sid Abraham", "Tim"], "pair1_score": 4, "pair2_score": 6},
    {"week": 3, "pair1": ["Michael Brennan", "Tim"], "pair2": ["Sid Abraham", "Dave"], "pair1_score": 1, "pair2_score": 9},
    {"week": 3, "pair1": ["Michael Brennan", "Sid Abraham"], "pair2": ["Tim", "Dave"], "pair1_score": 6, "pair2_score": 4},
    {"week": 3, "pair1": ["Mark B", "Jason"], "pair2": ["Mark A", "Ben"], "pair1_score": 2, "pair2_score": 8},
    {"week": 3, "pair1": ["Mark B", "Ben"], "pair2": ["Mark A", "Jason"], "pair1_score": 9, "pair2_score": 1},
    {"week": 3, "pair1": ["Mark B", "Mark A"], "pair2": ["Ben", "Jason"], "pair1_score": 0, "pair2_score": 10},
    {"week": 3, "pair1": ["Joanne", "Samuel Best"], "pair2": ["Stephen P", "Bev"], "pair1_score": 2, "pair2_score": 8},
    {"week": 3, "pair1": ["Joanne", "Bev"], "pair2": ["Stephen P", "Samuel Best"], "pair1_score": 3, "pair2_score": 7},
    {"week": 3, "pair1": ["Joanne", "Stephen P"], "pair2": ["Bev", "Samuel Best"], "pair1_score": 9, "pair2_score": 1},
    
    # Week 4
    {"week": 4, "pair1": ["Sid Abraham", "Oxy"], "pair2": ["Charlie Meacham", "Dave M"], "pair1_score": 4, "pair2_score": 6},
    {"week": 4, "pair1": ["Sid Abraham", "Dave M"], "pair2": ["Charlie Meacham", "Oxy"], "pair1_score": 8, "pair2_score": 2},
    {"week": 4, "pair1": ["Sid Abraham", "Charlie Meacham"], "pair2": ["Dave M", "Oxy"], "pair1_score": 8, "pair2_score": 2},
    {"week": 4, "pair1": ["Michael Brennan", "Joanne"], "pair2": ["Stephen P", "Jon"], "pair1_score": 1, "pair2_score": 9},
    {"week": 4, "pair1": ["Michael Brennan", "Jon"], "pair2": ["Stephen P", "Joanne"], "pair1_score": 9, "pair2_score": 1},
    {"week": 4, "pair1": ["Michael Brennan", "Stephen P"], "pair2": ["Jon", "Joanne"], "pair1_score": 10, "pair2_score": 0},
    {"week": 4, "pair1": ["Jason", "Liz"], "pair2": ["Shelagh", "Steve C"], "pair1_score": 8, "pair2_score": 2},
    {"week": 4, "pair1": ["Jason", "Steve C"], "pair2": ["Shelagh", "Liz"], "pair1_score": 8, "pair2_score": 2},
    {"week": 4, "pair1": ["Jason", "Shelagh"], "pair2": ["Steve C", "Liz"], "pair1_score": 10, "pair2_score": 0},
    
    # Week 5
    {"week": 5, "pair1": ["Michael Brennan", "Jon"], "pair2": ["Charlie Meacham", "Mark B"], "pair1_score": 3, "pair2_score": 5},
    {"week": 5, "pair1": ["Michael Brennan", "James"], "pair2": ["Charlie Meacham", "Mark B"], "pair1_score": 7, "pair2_score": 1},
    {"week": 5, "pair1": ["Michael Brennan", "Charlie Meacham"], "pair2": ["Mark B", "James"], "pair1_score": 7, "pair2_score": 1},
    {"week": 5, "pair1": ["Michael Brennan", "Mark B"], "pair2": ["James", "Charlie Meacham"], "pair1_score": 3, "pair2_score": 5},
    {"week": 5, "pair1": ["Mark A", "Steve C"], "pair2": ["Shelagh", "Tim"], "pair1_score": 3, "pair2_score": 7},
    {"week": 5, "pair1": ["Mark A", "Tim"], "pair2": ["Shelagh", "Steve C"], "pair1_score": 9, "pair2_score": 1},
    {"week": 5, "pair1": ["Mark A", "Shelagh"], "pair2": ["Tim", "Steve C"], "pair1_score": 2, "pair2_score": 8},
    
    # Week 6
    {"week": 6, "pair1": ["Sid Abraham", "Jon"], "pair2": ["Michael Brennan", "Charlie Meacham"], "pair1_score": 4, "pair2_score": 4},
    {"week": 6, "pair1": ["Sid Abraham", "Stephen P"], "pair2": ["Michael Brennan", "Jon"], "pair1_score": 7, "pair2_score": 1},
    {"week": 6, "pair1": ["Michael Brennan", "Stephen P"], "pair2": ["Charlie Meacham", "Jon"], "pair1_score": 1, "pair2_score": 7},
    {"week": 6, "pair1": ["Charlie Meacham", "Stephen P"], "pair2": ["Sid Abraham", "Michael Brennan"], "pair1_score": 0, "pair2_score": 8},
    {"week": 6, "pair1": ["Mark A", "Joanne"], "pair2": ["Mark B", "Shelagh"], "pair1_score": 7, "pair2_score": 3},
    {"week": 6, "pair1": ["Mark A", "Shelagh"], "pair2": ["Mark B", "Joanne"], "pair1_score": 6, "pair2_score": 4},
    {"week": 6, "pair1": ["Mark A", "Mark B"], "pair2": ["Shelagh", "Joanne"], "pair1_score": 7, "pair2_score": 3},
]

def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    """Calculate expected score using ELO formula"""
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400))

def update_elo(old_rating: float, actual_score: float, expected_score: float, k_factor: int = 32) -> float:
    """Update ELO rating based on match result"""
    return old_rating + k_factor * (actual_score - expected_score)

def normalize_name(name: str) -> str:
    """Normalize player names for consistency"""
    name = name.strip()
    return NAME_MAPPING.get(name, name)

def run_elo_simulation(starting_elos: Dict[str, int], scenario_name: str) -> Dict[str, float]:
    """Run complete ELO simulation for a season"""
    print(f"\n=== {scenario_name} ===")
    print("Starting ELO ratings:")
    for name, rating in sorted(starting_elos.items()):
        print(f"  {name}: {rating}")
    
    # Initialize current ratings
    current_ratings = starting_elos.copy()
    
    # Process each match
    for i, match in enumerate(MATCH_RESULTS):
        week = match["week"]
        pair1 = [normalize_name(name) for name in match["pair1"]]
        pair2 = [normalize_name(name) for name in match["pair2"]]
        pair1_score = match["pair1_score"]
        pair2_score = match["pair2_score"]
        
        # Calculate pair average ratings
        pair1_avg = sum(current_ratings[name] for name in pair1) / len(pair1)
        pair2_avg = sum(current_ratings[name] for name in pair2) / len(pair2)
        
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
        
        # Update ratings for each player
        for name in pair1:
            old_rating = current_ratings[name]
            new_rating = update_elo(old_rating, pair1_actual, pair1_expected)
            current_ratings[name] = new_rating
        
        for name in pair2:
            old_rating = current_ratings[name]
            new_rating = update_elo(old_rating, pair2_actual, pair2_expected)
            current_ratings[name] = new_rating
        
        # Print match summary
        print(f"\nWeek {week}, Match {i+1}: {pair1} vs {pair2}")
        print(f"  Score: {pair1_score}-{pair2_score}")
        print(f"  Pair averages: {pair1_avg:.0f} vs {pair2_avg:.0f}")
        print(f"  Expected: {pair1_expected:.3f} vs {pair2_expected:.3f}")
        print(f"  Actual: {pair1_actual:.3f} vs {pair2_actual:.3f}")
    
    return current_ratings

def print_final_table(ratings: Dict[str, float], scenario_name: str):
    """Print final ELO table sorted by rating"""
    print(f"\n=== Final {scenario_name} ELO Table ===")
    sorted_players = sorted(ratings.items(), key=lambda x: x[1], reverse=True)
    
    print(f"{'Rank':<4} {'Player':<20} {'Final ELO':<10}")
    print("-" * 36)
    
    for rank, (name, rating) in enumerate(sorted_players, 1):
        print(f"{rank:<4} {name:<20} {rating:.0f}")

def compare_scenarios(scenario1: Dict[str, float], scenario2: Dict[str, float]):
    """Compare the two scenarios and show differences"""
    print(f"\n=== SCENARIO COMPARISON ===")
    
    # Create sorted lists for both scenarios
    sorted1 = sorted(scenario1.items(), key=lambda x: x[1], reverse=True)
    sorted2 = sorted(scenario2.items(), key=lambda x: x[1], reverse=True)
    
    # Create ranking dictionaries
    rank1 = {name: rank for rank, (name, _) in enumerate(sorted1, 1)}
    rank2 = {name: rank for rank, (name, _) in enumerate(sorted2, 1)}
    
    print(f"{'Player':<20} {'ELO1 Rank':<10} {'ELO1 Rating':<12} {'ELO2 Rank':<10} {'ELO2 Rating':<12} {'Rank Diff':<10} {'Rating Diff':<12}")
    print("-" * 100)
    
    # Sort by ELO1 ranking for comparison
    for rank, (name, rating1) in enumerate(sorted1, 1):
        rating2 = scenario2[name]
        rank_diff = rank2[name] - rank
        rating_diff = rating2 - rating1
        
        rank_change = ""
        if rank_diff > 0:
            rank_change = f"+{rank_diff}"
        elif rank_diff < 0:
            rank_change = f"{rank_diff}"
        else:
            rank_change = "0"
            
        rating_change = f"{rating_diff:+.0f}"
        
        print(f"{name:<20} {rank:<10} {rating1:.0f}{'':<7} {rank2[name]:<10} {rating2:.0f}{'':<7} {rank_change:<10} {rating_change}")

if __name__ == "__main__":
    print("ELO SIMULATION: Winter 25 Season Results")
    print("=" * 50)
    
    # Run both scenarios
    scenario1_results = run_elo_simulation(STARTING_ELO_1, "Starting ELO 1")
    scenario2_results = run_elo_simulation(STARTING_ELO_2, "Starting ELO 2")
    
    # Print final tables
    print_final_table(scenario1_results, "Starting ELO 1")
    print_final_table(scenario2_results, "Starting ELO 2")
    
    # Compare scenarios
    compare_scenarios(scenario1_results, scenario2_results)
    
    print(f"\n=== KEY INSIGHTS ===")
    print("• Starting ELO 1 has wider rating spreads (900-1400)")
    print("• Starting ELO 2 has narrower rating spreads (1070-1200)")
    print("• Both scenarios processed the same match results")
    print("• Rating differences show impact of starting values on final rankings")