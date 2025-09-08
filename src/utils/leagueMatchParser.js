// League Match Data Parser
// Parses match results copied from league website

export const parseLeagueMatchData = (rawText) => {
  try {
    const lines = rawText.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    // Parse date and time (first line)
    const dateTimeLine = lines[0];
    const dateTimeMatch = dateTimeLine.match(/(\d{1,2}\s+\w+\s+\d{4})\s*-\s*(\d{1,2}:\d{2})/);
    
    let matchDate = null;
    let matchTime = null;
    
    if (dateTimeMatch) {
      const [, dateStr, timeStr] = dateTimeMatch;
      // Convert "27 April 2025" to "2025-04-27" format
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        matchDate = parsedDate.toISOString().split('T')[0];
      }
      matchTime = timeStr;
    }

    // Find team names - look for lines that appear to be team headers
    let homeTeam = '';
    let awayTeam = '';
    let currentLineIndex = 1;
    
    // The team names typically appear after date, before player pairs
    // Look for pattern where we have team name lines
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      // Skip lines that look like player names (contain multiple words that could be names)
      if (line && !line.includes('6 -') && !line.includes('- 6') && 
          !line.match(/\d+\.\d+/) && !line.match(/^\d+\s+\d+$/)) {
        if (!homeTeam && line.length > 0) {
          homeTeam = line;
        } else if (!awayTeam && line.length > 0 && line !== homeTeam) {
          awayTeam = line;
          currentLineIndex = i + 1;
          break;
        }
      }
    }

    // Parse player pairs and match results
    const pairs = [];
    const scorePattern = /(\d+)\s*-\s*(\d+)/g;
    
    // Find all lines with scores (3 rubber scores per line)
    const scoreLines = [];
    for (let i = currentLineIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip final result lines
      if (line.match(/^\d+\.\d+\s+\d+\.\d+/) || line.match(/^\d+\s+\d+$/)) {
        break;
      }
      
      const scores = [...line.matchAll(scorePattern)];
      if (scores.length >= 3) {
        scoreLines.push({ lineIndex: i, line: line, scores: scores });
      }
    }
    
    // For each score line, find the corresponding player names
    for (let scoreLineIndex = 0; scoreLineIndex < scoreLines.length; scoreLineIndex++) {
      const { lineIndex, line, scores } = scoreLines[scoreLineIndex];
      
      // Parse rubber scores
      const rubber1 = { home: parseInt(scores[0][1]), away: parseInt(scores[0][2]) };
      const rubber2 = { home: parseInt(scores[1][1]), away: parseInt(scores[1][2]) };
      const rubber3 = { home: parseInt(scores[2][1]), away: parseInt(scores[2][2]) };
      
      // Look for total scores
      const remainingText = line.substring(scores[2].index + scores[2][0].length);
      const totalMatch = remainingText.match(/(\d+)\s+(\d+)/);
      
      let totalHome = 0, totalAway = 0;
      if (totalMatch) {
        totalHome = parseInt(totalMatch[1]);
        totalAway = parseInt(totalMatch[2]);
      }
      
      // Extract player names from the lines before the score line
      // Look for pattern: Player names appear in lines before scores
      let homePlayer1 = '', homePlayer2 = '', awayPlayer1 = '', awayPlayer2 = '';
      
      // Start from a few lines before the score line and work backwards
      const startSearchIndex = Math.max(currentLineIndex, lineIndex - 6);
      const playerLines = [];
      
      for (let j = startSearchIndex; j < lineIndex; j++) {
        const playerLine = lines[j];
        if (playerLine && !playerLine.includes('-') && !scorePattern.test(playerLine) && 
            !playerLine.includes('GF') && !playerLine.includes('GA') &&
            playerLine.trim().length > 0) {
          playerLines.push(playerLine.trim());
        }
      }
      
      // Try different strategies to extract player names
      // Strategy 1: Look for lines with multiple names separated by whitespace
      for (const playerLine of playerLines.slice(-4)) { // Take last 4 potential player lines
        if (playerLine.includes('    ') || playerLine.includes('\t')) {
          // Line contains multiple names separated by significant whitespace
          const parts = playerLine.split(/\s{2,}/).filter(part => part.trim());
          if (parts.length >= 2) {
            if (!homePlayer1) {
              homePlayer1 = parts[0].trim();
              awayPlayer1 = parts[1].trim();
            } else if (!homePlayer2) {
              homePlayer2 = parts[0].trim();
              awayPlayer2 = parts[1].trim();
              break; // We have both pairs
            }
          }
        }
      }
      
      // Strategy 2: If we didn't get players from whitespace separation, try sequential lines
      if (!homePlayer1 || !homePlayer2) {
        // Reset and try sequential approach
        homePlayer1 = homePlayer2 = awayPlayer1 = awayPlayer2 = '';
        
        const candidateLines = playerLines.slice(-6).filter(line => 
          line && line.trim().length > 0 && 
          !line.toLowerCase().includes('team') &&
          !line.toLowerCase().includes('club')
        );
        
        // Look for pairs of names in the format of your example
        let pairCount = 0;
        for (let k = 0; k < candidateLines.length && pairCount < 2; k++) {
          const line = candidateLines[k];
          
          // Try splitting by significant whitespace first
          let parts = line.split(/\s{4,}/).filter(part => part.trim());
          
          // If no significant whitespace, try tabs
          if (parts.length < 2) {
            parts = line.split(/\t+/).filter(part => part.trim());
          }
          
          // If still no luck, split by multiple spaces
          if (parts.length < 2) {
            parts = line.split(/\s{2,}/).filter(part => part.trim());
          }
          
          if (parts.length >= 2) {
            if (pairCount === 0) {
              homePlayer1 = parts[0].trim();
              awayPlayer1 = parts[1].trim();
              pairCount++;
            } else if (pairCount === 1) {
              homePlayer2 = parts[0].trim();
              awayPlayer2 = parts[1].trim();
              pairCount++;
            }
          }
        }
      }
      
      pairs.push({
        pairNumber: pairs.length + 1,
        homePlayer1: homePlayer1 || `Home Player ${pairs.length * 2 + 1}`,
        homePlayer2: homePlayer2 || `Home Player ${pairs.length * 2 + 2}`,
        awayPlayer1: awayPlayer1 || `Away Player ${pairs.length * 2 + 1}`,
        awayPlayer2: awayPlayer2 || `Away Player ${pairs.length * 2 + 2}`,
        rubbers: [rubber1, rubber2, rubber3],
        totalGames: { home: totalHome, away: totalAway }
      });
    }
    
    // If we couldn't parse pairs properly, try a different approach
    if (pairs.length === 0) {
      // Fallback: create 3 empty pairs with extracted scores if available
      const allScoreLines = lines.filter(line => {
        const scores = [...line.matchAll(scorePattern)];
        return scores.length >= 3;
      });
      
      for (let i = 0; i < Math.min(3, allScoreLines.length); i++) {
        const line = allScoreLines[i];
        const scores = [...line.matchAll(scorePattern)];
        
        if (scores.length >= 3) {
          pairs.push({
            pairNumber: i + 1,
            homePlayer1: `Home Player ${i * 2 + 1}`,
            homePlayer2: `Home Player ${i * 2 + 2}`,
            awayPlayer1: `Away Player ${i * 2 + 1}`,
            awayPlayer2: `Away Player ${i * 2 + 2}`,
            rubbers: [
              { home: parseInt(scores[0][1]), away: parseInt(scores[0][2]) },
              { home: parseInt(scores[1][1]), away: parseInt(scores[1][2]) },
              { home: parseInt(scores[2][1]), away: parseInt(scores[2][2]) }
            ],
            totalGames: { home: 0, away: 0 }
          });
        }
      }
    }

    return {
      success: true,
      data: {
        matchDate,
        matchTime,
        homeTeam: homeTeam || 'Home Team',
        awayTeam: awayTeam || 'Away Team',
        pairs,
        rawText
      }
    };

  } catch (error) {
    console.error('Error parsing league match data:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Test function with the provided example
export const testParseExample = () => {
  const exampleText = `27 April 2025 - 10:00
     Cawood 2          
Market Weighton    Steven Walter
Nas Shefta    John Best
Mike Brennan    Mark Bottomley
Steve Caslake    GF    GA
Ian Robson
Aled Edwards    6 - 6    7 - 5    10 - 2    23    13
Nick Collins
Stewart Berry    6 - 6    5 - 7    11 - 1    22    14
Ken Bottomer
Keigan Freeman Hacker    6 - 6    5 - 7    11 - 1    22    14
Market Weighton    8.5    3.5    Cawood 2
67    41`;

  const result = parseLeagueMatchData(exampleText);
  console.log('Parse Result:', JSON.stringify(result, null, 2));
  return result;
};