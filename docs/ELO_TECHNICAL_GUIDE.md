# ELO System Technical Implementation Guide

## 🎯 Purpose
This document provides detailed technical guidance for developers working with the ELO rating system implementation in the Tennis Ladder App.

## 🏗️ Architecture Overview

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Application    │    │   Database      │
│                 │    │     Logic       │    │   Functions     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - ELO displays  │────│ - useApp.js     │────│ - ELO history   │
│ - Match results │    │ - Enhanced      │    │ - 5 functions   │
│ - Ranking views │    │   deletion      │    │ - Restoration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **Match Result Submission** → ELO Calculation → Database Update
2. **Season Deletion** → ELO Restoration → Player Rating Update
3. **New Season Creation** → ELO Seeding → Player Initialization

## 📊 ELO Calculation Engine

### Core Formula Implementation
```javascript
// Expected Score Calculation
function calculateExpectedScore(ratingA, ratingB) {
    return 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400));
}

// ELO Rating Update
function updateElo(oldRating, actualScore, expectedScore, kFactor = 32) {
    return oldRating + kFactor * (actualScore - expectedScore);
}
```

### Team ELO for Doubles Matches
```javascript
// Calculate team average for doubles
function calculateTeamElo(player1Elo, player2Elo) {
    return (player1Elo + player2Elo) / 2;
}

// Process doubles match result
function processDoublesMatch(team1Players, team2Players, team1Score, team2Score) {
    const team1AvgElo = calculateTeamElo(team1Players[0].elo, team1Players[1].elo);
    const team2AvgElo = calculateTeamElo(team2Players[0].elo, team2Players[1].elo);
    
    const team1Expected = calculateExpectedScore(team1AvgElo, team2AvgElo);
    const team2Expected = 1.0 - team1Expected;
    
    const totalGames = team1Score + team2Score;
    const team1Actual = team1Score / totalGames;
    const team2Actual = team2Score / totalGames;
    
    // Update each player's ELO individually
    return {
        team1Changes: team1Players.map(player => 
            updateElo(player.elo, team1Actual, team1Expected)
        ),
        team2Changes: team2Players.map(player => 
            updateElo(player.elo, team2Actual, team2Expected)
        )
    };
}
```

## 🗃️ Database Schema Deep Dive

### ELO History Table Structure
```sql
CREATE TABLE elo_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_player_id UUID NOT NULL REFERENCES season_players(id) ON DELETE CASCADE,
  match_fixture_id UUID NOT NULL REFERENCES match_fixtures(id) ON DELETE CASCADE,
  old_rating INTEGER NOT NULL CHECK (old_rating >= 500 AND old_rating <= 3000),
  new_rating INTEGER NOT NULL CHECK (new_rating >= 500 AND new_rating <= 3000),
  rating_change INTEGER NOT NULL,
  k_factor INTEGER DEFAULT 32 CHECK (k_factor > 0),
  opponent_avg_rating INTEGER,
  expected_score DECIMAL(6,6) CHECK (expected_score >= 0 AND expected_score <= 1),
  actual_score DECIMAL(6,6) CHECK (actual_score >= 0 AND actual_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_elo_history_season_player ON elo_history(season_player_id);
CREATE INDEX idx_elo_history_match_fixture ON elo_history(match_fixture_id);
CREATE INDEX idx_elo_history_created_at ON elo_history(created_at);
CREATE INDEX idx_elo_history_rating_change ON elo_history(rating_change);
```

### Database Function Details

#### 1. ELO Restoration Function
```sql
CREATE OR REPLACE FUNCTION restore_player_elo_after_deletion(
    player_uuid UUID,
    deleted_season_uuid UUID
) RETURNS INTEGER AS $$
DECLARE
    most_recent_elo INTEGER;
    affected_seasons INTEGER := 0;
BEGIN
    -- Get the most recent ELO rating before the deleted season
    SELECT get_most_recent_elo(player_uuid, deleted_season_uuid) 
    INTO most_recent_elo;
    
    -- If no previous ELO found, use default
    IF most_recent_elo IS NULL THEN
        most_recent_elo := 1200;
    END IF;
    
    -- Update all seasons that come after the deleted one
    UPDATE season_players 
    SET elo_rating = most_recent_elo
    WHERE player_id = player_uuid
      AND season_id IN (
          SELECT s.id FROM seasons s 
          WHERE s.created_at > (
              SELECT created_at FROM seasons WHERE id = deleted_season_uuid
          )
      );
    
    GET DIAGNOSTICS affected_seasons = ROW_COUNT;
    RETURN affected_seasons;
END;
$$ LANGUAGE plpgsql;
```

#### 2. ELO Calculation Function
```sql
CREATE OR REPLACE FUNCTION calculate_elo_change(
    old_rating INTEGER,
    actual_score DECIMAL,
    expected_score DECIMAL,
    k_factor INTEGER DEFAULT 32
) RETURNS INTEGER AS $$
BEGIN
    RETURN old_rating + ROUND(k_factor * (actual_score - expected_score));
END;
$$ LANGUAGE plpgsql;
```

## 🔧 Enhanced Deletion Implementation

### Phase-by-Phase Breakdown

#### Phase 1: Data Collection
```javascript
// Collect season data for restoration
const seasonData = await supabase
  .from('seasons')
  .select(`
    id, name, created_at,
    season_players!inner(
      id, player_id, elo_rating,
      profiles!inner(name)
    )
  `)
  .eq('id', seasonId)
  .single();

if (!seasonData.data) {
  throw new Error(`Season ${seasonId} not found`);
}
```

#### Phase 2: ELO History Cleanup
```javascript
// Get all season player IDs for this season
const seasonPlayerIds = seasonData.season_players.map(sp => sp.id);

// Delete ELO history records first to prevent FK conflicts
const { error: eloHistoryError } = await supabase
  .from('elo_history')
  .delete()
  .in('season_player_id', seasonPlayerIds);

if (eloHistoryError) {
  throw new Error(`Failed to delete ELO history: ${eloHistoryError.message}`);
}
```

#### Phase 3: Match Data Deletion
```javascript
// Standard cascade deletion handles:
// match_results → match_fixtures → matches
const { error: matchError } = await supabase
  .from('matches')
  .delete()
  .eq('season_id', seasonId);
```

#### Phase 4: ELO Restoration
```javascript
// Restore ELO for each affected player
for (const seasonPlayer of seasonData.season_players) {
  const { data: restoredElo, error: restoreError } = await supabase
    .rpc('restore_player_elo_after_deletion', {
      player_uuid: seasonPlayer.player_id,
      deleted_season_uuid: seasonId
    });
    
  if (restoreError) {
    console.error(`ELO restoration failed for ${seasonPlayer.profiles.name}`);
  } else {
    console.log(`Restored ELO for ${seasonPlayer.profiles.name}: ${restoredElo} seasons affected`);
  }
}
```

#### Phase 5: Final Cleanup
```javascript
// Delete season players and season
await supabase.from('season_players').delete().eq('season_id', seasonId);
await supabase.from('seasons').delete().eq('id', seasonId);
```

## 🎮 Frontend Integration Points

### ELO Display in Ladder Tables
```javascript
// Example integration in LadderTab component
const sortedPlayers = ladderPlayers.sort((a, b) => {
  if (sortBy === 'elo') {
    return (b.elo_rating || 1200) - (a.elo_rating || 1200);
  }
  // ... other sorting options
});

// Display format
const formatEloDisplay = (elo) => {
  if (!elo) return '1200*'; // Default rating with asterisk
  return elo.toString();
};
```

### Match Prediction Calculator
```javascript
// Calculate match win probability
function calculateMatchPrediction(team1Players, team2Players) {
  const team1AvgElo = team1Players.reduce((sum, p) => sum + (p.elo_rating || 1200), 0) / team1Players.length;
  const team2AvgElo = team2Players.reduce((sum, p) => sum + (p.elo_rating || 1200), 0) / team2Players.length;
  
  const team1WinProbability = 1.0 / (1.0 + Math.pow(10, (team2AvgElo - team1AvgElo) / 400));
  
  return {
    team1Probability: team1WinProbability,
    team2Probability: 1.0 - team1WinProbability,
    eloDifference: Math.abs(team1AvgElo - team2AvgElo),
    isUpset: Math.abs(team1AvgElo - team2AvgElo) > 150
  };
}
```

## 🧪 Testing Strategy

### Unit Tests for ELO Functions
```javascript
describe('ELO Calculation', () => {
  test('should calculate expected score correctly', () => {
    const expectedScore = calculateExpectedScore(1200, 1200);
    expect(expectedScore).toBeCloseTo(0.5, 3);
  });
  
  test('should handle rating updates', () => {
    const newRating = updateElo(1200, 1.0, 0.5, 32); // Player won when expected to draw
    expect(newRating).toBe(1216); // Should gain 16 points
  });
  
  test('should process doubles matches', () => {
    const team1 = [{elo: 1200}, {elo: 1300}]; // Avg: 1250
    const team2 = [{elo: 1100}, {elo: 1200}]; // Avg: 1150
    
    const result = processDoublesMatch(team1, team2, 6, 4); // Team1 wins 6-4
    
    expect(result.team1Changes[0]).toBeGreaterThan(1200); // Both team1 players gain ELO
    expect(result.team2Changes[0]).toBeLessThan(1100);    // Both team2 players lose ELO
  });
});
```

### Integration Tests
```javascript
describe('Enhanced Deletion', () => {
  test('should restore ELO after season deletion', async () => {
    // Create test season with players
    // Record initial ELO ratings
    // Delete season
    // Verify ELO ratings restored correctly
  });
  
  test('should handle new players gracefully', async () => {
    // Create player with only one season
    // Delete that season
    // Verify player ELO resets to 1200
  });
});
```

## 🚀 Performance Considerations

### Database Query Optimization
```sql
-- Efficient ELO history queries with proper indexing
EXPLAIN ANALYZE
SELECT eh.*, mf.court_number, mr.pair1_score, mr.pair2_score
FROM elo_history eh
JOIN match_fixtures mf ON eh.match_fixture_id = mf.id
JOIN match_results mr ON mf.id = mr.fixture_id
WHERE eh.season_player_id = $1
ORDER BY eh.created_at DESC
LIMIT 10;

-- Should use: Index Scan on idx_elo_history_season_player
```

### Memory Management
```javascript
// Process ELO updates in batches for large seasons
async function batchProcessEloUpdates(matches, batchSize = 10) {
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    await Promise.all(batch.map(match => processMatchElo(match)));
    
    // Allow garbage collection between batches
    if (i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
```

## 🔒 Security Considerations

### Data Validation
```javascript
// Validate ELO ratings before database insertion
function validateEloRating(rating) {
  if (typeof rating !== 'number' || rating < 500 || rating > 3000) {
    throw new Error(`Invalid ELO rating: ${rating}. Must be between 500-3000.`);
  }
  return Math.round(rating); // Ensure integer values
}

// Validate match scores
function validateMatchScore(score1, score2) {
  if (score1 < 0 || score2 < 0 || (score1 + score2) === 0) {
    throw new Error('Invalid match scores');
  }
}
```

### Transaction Safety
```javascript
// Wrap all ELO operations in transactions
async function safeEloUpdate(seasonId, matchData) {
  const { data, error } = await supabase.rpc('begin_transaction');
  
  try {
    // Perform ELO calculations
    await updateMatchElos(matchData);
    
    // Commit transaction
    await supabase.rpc('commit_transaction');
    
  } catch (err) {
    // Rollback on any error
    await supabase.rpc('rollback_transaction');
    throw err;
  }
}
```

## 📈 Monitoring & Analytics

### ELO System Health Checks
```javascript
// Monitor ELO rating distribution
async function analyzeEloDistribution(seasonId) {
  const { data } = await supabase
    .from('season_players')
    .select('elo_rating')
    .eq('season_id', seasonId);
    
  const ratings = data.map(p => p.elo_rating);
  return {
    min: Math.min(...ratings),
    max: Math.max(...ratings),
    average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    standardDeviation: calculateStdDev(ratings)
  };
}

// Track prediction accuracy
async function calculatePredictionAccuracy(seasonId) {
  const { data } = await supabase
    .from('elo_history')
    .select('expected_score, actual_score')
    .in('season_player_id', 
      supabase.from('season_players').select('id').eq('season_id', seasonId)
    );
    
  const predictions = data.map(record => ({
    predicted: record.expected_score > 0.5,
    actual: record.actual_score > 0.5
  }));
  
  const correct = predictions.filter(p => p.predicted === p.actual).length;
  return (correct / predictions.length) * 100; // Percentage accuracy
}
```

## 🔄 Maintenance Tasks

### Periodic ELO System Maintenance
```javascript
// Monthly ELO system health check
async function monthlyEloMaintenance() {
  console.log('Starting monthly ELO maintenance...');
  
  // 1. Check for orphaned ELO history records
  await supabase.rpc('cleanup_orphaned_elo_history');
  
  // 2. Validate ELO rating ranges
  const { data: invalidRatings } = await supabase
    .from('season_players')
    .select('*')
    .or('elo_rating.lt.500,elo_rating.gt.3000');
    
  if (invalidRatings.length > 0) {
    console.warn(`Found ${invalidRatings.length} invalid ELO ratings`);
  }
  
  // 3. Generate ELO analytics report
  const analytics = await generateEloAnalytics();
  console.log('ELO System Analytics:', analytics);
}
```

## 📚 Additional Resources

### Related Documentation
- `ELO_SYSTEM_COMPLETE.md` - High-level implementation overview
- `ENHANCED_DELETION_SYSTEM.md` - Detailed deletion system guide
- `DATABASE_SCHEMA.md` - Updated schema with ELO tables

### External References
- [ELO Rating System Wikipedia](https://en.wikipedia.org/wiki/Elo_rating_system)
- [Chess.com ELO Explanation](https://www.chess.com/terms/elo-rating-chess)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)

---

**🎾 TECHNICAL GUIDE VERSION 1.0**

This guide covers the complete technical implementation of the ELO rating system. For questions or clarifications, refer to the implementation files or create test scenarios to validate behavior.

*Last updated: September 2025*  
*Compatible with: Tennis Ladder App v1.0.91*