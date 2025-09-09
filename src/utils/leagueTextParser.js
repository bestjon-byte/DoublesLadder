// League Match Text Parser - New Implementation
// Parses match results from copied text format

export const parseLeagueMatchFromText = (rawText) => {
  try {
    const lines = rawText.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 5) {
      throw new Error('Not enough lines in the text - please paste the complete match data');
    }

    // Parse match header (first line)
    const headerLine = lines[0];
    const { homeTeam, awayTeam } = parseTeamNames(headerLine);
    
    // Parse date and time (second line)
    const { matchDate, matchTime } = parseDateTime(lines[1]);
    
    // Parse the structured data
    const { homeTeamPairs, awayTeamPairs, scoringMatrix } = parseMatchData(lines.slice(2), homeTeam, awayTeam);
    
    return {
      success: true,
      data: {
        matchDate,
        matchTime,
        homeTeam,
        awayTeam,
        homeTeamPairs,
        awayTeamPairs,
        scoringMatrix,
        source: 'text'
      }
    };

  } catch (error) {
    console.error('Error parsing league match text:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

const parseTeamNames = (headerLine) => {
  // Parse "Fixtures - Market Weighton v Cawood 2"
  // Remove "Fixtures - " prefix if present
  let cleanHeader = headerLine.replace(/^Fixtures\s*-\s*/, '');
  
  // Split by " v " or " vs "
  const vsMatch = cleanHeader.match(/^(.+?)\s+v[s]?\s+(.+)$/i);
  
  if (vsMatch) {
    return {
      homeTeam: vsMatch[1].trim(),
      awayTeam: vsMatch[2].trim()
    };
  }
  
  throw new Error('Could not parse team names from header');
};

const parseDateTime = (dateTimeLine) => {
  // Parse "27 April 2025 - 10:00"
  const dateTimeMatch = dateTimeLine.match(/(\d{1,2}\s+\w+\s+\d{4})\s*-\s*(\d{1,2}:\d{2})/);
  
  if (!dateTimeMatch) {
    throw new Error('Could not parse date and time');
  }
  
  const [, dateStr, timeStr] = dateTimeMatch;
  const parsedDate = new Date(dateStr);
  
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  return {
    matchDate: parsedDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    matchTime: timeStr
  };
};

const parseMatchData = (dataLines, homeTeam, awayTeam) => {
  // Find the line with away team header (e.g., "Cawood 2")
  let awayTeamHeaderIndex = -1;
  for (let i = 0; i < dataLines.length; i++) {
    if (dataLines[i].trim() === awayTeam) {
      awayTeamHeaderIndex = i;
      break;
    }
  }
  
  if (awayTeamHeaderIndex === -1) {
    throw new Error(`Could not find away team header (${awayTeam})`);
  }
  
  // Parse away team pairs and home team pairs based on the exact structure
  const { awayTeamPairs, homeTeamPairs, scoringMatrix } = parseStructuredData(dataLines, awayTeamHeaderIndex, homeTeam, awayTeam);
  
  return {
    homeTeamPairs,
    awayTeamPairs,
    scoringMatrix
  };
};

const parseStructuredData = (dataLines, awayTeamHeaderIndex, homeTeam, awayTeam) => {
  const awayTeamPairs = [];
  const homeTeamPairs = [];
  const scoringMatrix = [];
  
  // Parse away team section (after header until "GF GA")
  const awayPlayers = [];
  for (let i = awayTeamHeaderIndex + 1; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    
    // Stop when we hit "GF GA" 
    if (line.includes('GF') && line.includes('GA')) {
      break;
    }
    
    // Stop if we see score patterns
    if (line.match(/\d+\s*-\s*\d+/)) {
      break;
    }
    
    // Extract player names from this line
    // Line format: "HomeTeam    Player1" or "Player2    Player3" etc.
    let cleanLine = line;
    
    // Remove home team name if present at start
    if (cleanLine.startsWith(homeTeam)) {
      cleanLine = cleanLine.substring(homeTeam.length).trim();
    }
    
    // Split by significant whitespace (4+ spaces or tabs)
    const names = cleanLine.split(/\s{4,}|\t+/).filter(name => name.trim().length > 0);
    
    // Add all names found on this line
    names.forEach(name => {
      const cleanName = name.trim();
      if (cleanName && !cleanName.includes('GF') && !cleanName.includes('GA')) {
        awayPlayers.push(cleanName);
      }
    });
  }
  
  // Group away players into pairs
  for (let i = 0; i < awayPlayers.length; i += 2) {
    if (i + 1 < awayPlayers.length) {
      awayTeamPairs.push({
        player1: awayPlayers[i],
        player2: awayPlayers[i + 1]
      });
    }
  }
  
  // Parse home team section (lines with scores)
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    
    // Look for lines with 3 scores (rubber results)
    const scorePattern = /(\d+)\s*-\s*(\d+)/g;
    const scores = [...line.matchAll(scorePattern)];
    
    if (scores.length >= 3) {
      // Extract home team pair (should be in previous 1-2 lines)
      const homePlayer1 = i > 0 ? dataLines[i - 1].trim() : '';
      const homePlayer2Line = line.split(/\d+\s*-\s*\d+/)[0].trim(); // Everything before first score
      
      if (homePlayer1 && homePlayer2Line) {
        homeTeamPairs.push({
          player1: homePlayer1,
          player2: homePlayer2Line
        });
        
        // Extract the three scores
        const rubberScores = scores.slice(0, 3).map(match => ({
          homeScore: parseInt(match[1]),
          awayScore: parseInt(match[2])
        }));
        
        scoringMatrix.push(rubberScores);
      }
    }
  }
  
  return { awayTeamPairs, homeTeamPairs, scoringMatrix };
};

const extractPlayerNamesFromLine = (line) => {
  // Clean the line and split by significant whitespace
  const cleanLine = line.replace(/\s+/g, ' ').trim();
  
  // Split by multiple spaces (4 or more) or tabs
  let parts = cleanLine.split(/\s{4,}|\t+/).filter(part => part.trim());
  
  // If no significant whitespace, try splitting by detecting capital letters
  if (parts.length < 2) {
    parts = smartSplitPlayerNames(cleanLine);
  }
  
  return parts.filter(part => 
    part && 
    part.trim().length > 2 && 
    !part.includes('GF') && 
    !part.includes('GA') &&
    !part.match(/\d+\s*-\s*\d+/) // Not a score
  );
};

const smartSplitPlayerNames = (text) => {
  // Try to split player names by detecting where new names start
  // Look for capital letter followed by lowercase (start of new name)
  const words = text.split(/\s+/);
  const names = [];
  let currentName = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // If this word starts with a capital and we already have words, start new name
    if (word.charAt(0) === word.charAt(0).toUpperCase() && currentName.length > 0 && i > 0) {
      if (currentName.length > 0) {
        names.push(currentName.join(' '));
        currentName = [word];
      }
    } else {
      currentName.push(word);
    }
  }
  
  // Add the last name
  if (currentName.length > 0) {
    names.push(currentName.join(' '));
  }
  
  return names;
};

const extractHomeTeamPair = (dataLines, scoreLineIndex) => {
  // Look backwards from the score line to find the player names
  // They should be in the 1-2 lines immediately before
  
  const playerNames = [];
  
  for (let i = Math.max(0, scoreLineIndex - 2); i < scoreLineIndex; i++) {
    const line = dataLines[i];
    
    // Skip lines with scores or summary info
    if (line.match(/\d+\s*-\s*\d+/) || line.match(/\d+\.\d+/) || 
        line.includes('GF') || line.includes('GA')) {
      continue;
    }
    
    // Extract names from this line
    const names = extractPlayerNamesFromLine(line);
    playerNames.push(...names);
  }
  
  // Should have 2 names for a pair
  if (playerNames.length >= 2) {
    return {
      player1: playerNames[0],
      player2: playerNames[1]
    };
  }
  
  // Fallback: create generic names
  return {
    player1: `Home Player ${Math.floor(Math.random() * 1000)}`,
    player2: `Home Player ${Math.floor(Math.random() * 1000)}`
  };
};

// Test function
export const testTextParser = () => {
  const testText = `Fixtures - Selby 2 v Cawood 2
18 May 2025 - 10:00

     Cawood 2          
Selby 2    John Best
Mike Brennan    Nas Shefta
Steven Walter    Steve Caslake
Mark Bottomley    GF    GA
Charlie Watson
Marc Hodge    6 - 6    9 - 3    12 - 0    27    9
Jason Long
Jim Gabbitas    1 - 11    4 - 8    11 - 1    16    20
John Reveley
Steve Parkin    9 - 3    8 - 4    9 - 3    26    10
Selby 2    9.5    2.5    Cawood 2
69    39`;

  const result = parseLeagueMatchFromText(testText);
  console.log('Text Parse Result:', JSON.stringify(result, null, 2));
  return result;
};