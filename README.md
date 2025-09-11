# Tennis Ladder App

A doubles tennis ladder management system for Cawood Tennis Club.

## Tennis Scoring System

**Important**: This application tracks doubles tennis using the following terminology:

### Match vs Game Definitions
- **Match**: A complete doubles encounter between two pairs (Player A & Player B vs Player C & Player D)
- **Game**: Individual points contest within a match, won by first pair to reach the target score
- **Match Score**: Shows games won by each pair (e.g., "6-4" means 10 games played total, first pair won 6 games, second pair won 4 games)

### Example
If the final score shows "6-4":
- **1 Match** was played (A&B vs C&D)
- **10 Games** were played total (6 + 4)  
- **Match Winner**: First pair (won majority of games)
- **Game Win Rate**: Individual games won divided by total games played

### Statistics Calculations
- **Match Win Rate**: Percentage of complete matches won (determined by who won majority of games)
- **Game Win Rate**: Percentage of individual games won across all matches
- **Best Partner**: Calculated based on game win rate when playing together
- **Nemesis Analysis**: Based on game win rate against specific opponents

## Features
- Player registration and approval
- Match scheduling and availability
- Score tracking and rankings
- Admin dashboard

## Running Locally
```bash
npm install
npm start# Rollback to v1.0.42 - working version
