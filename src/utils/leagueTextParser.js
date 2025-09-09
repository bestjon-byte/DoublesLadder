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
  // Find the line with "Cawood 2" (away team header)
  let awayTeamHeaderIndex = -1;
  for (let i = 0; i < dataLines.length; i++) {
    if (dataLines[i].includes(awayTeam)) {
      awayTeamHeaderIndex = i;
      break;
    }
  }
  
  if (awayTeamHeaderIndex === -1) {
    throw new Error(`Could not find away team header (${awayTeam})`);
  }
  
  // Parse away team pairs from the header section
  const awayTeamPairs = parseAwayTeamPairs(dataLines, awayTeamHeaderIndex);
  
  // Find lines with home team and scores
  const homeTeamPairs = [];
  const scoringMatrix = [];
  
  // Look for lines that start with home team name followed by player names and scores
  let foundHomeTeamSection = false;
  
  for (let i = awayTeamHeaderIndex + 1; i < dataLines.length; i++) {
    const line = dataLines[i];
    
    // Skip the final summary lines
    if (line.includes(homeTeam) && line.includes(awayTeam) && line.match(/\d+\.\d+/)) {
      break; // This is the final score summary
    }
    
    // Look for lines with scores (pattern: numbers followed by dashes)
    const scorePattern = /(\d+)\s*-\s*(\d+)/g;
    const scores = [...line.matchAll(scorePattern)];
    
    if (scores.length >= 3) {
      // This line has match scores, extract the home team pair
      const homeTeamPair = extractHomeTeamPair(dataLines, i);
      if (homeTeamPair) {
        homeTeamPairs.push(homeTeamPair);
        
        // Extract the three scores
        const rubberScores = scores.slice(0, 3).map(match => ({
          homeScore: parseInt(match[1]),
          awayScore: parseInt(match[2])
        }));
        
        scoringMatrix.push(rubberScores);
      }
    }
  }
  
  return {
    homeTeamPairs,
    awayTeamPairs,
    scoringMatrix
  };
};

const parseAwayTeamPairs = (dataLines, headerIndex) => {
  const pairs = [];
  
  // The away team players should be in the lines immediately after the header
  // Format: "Steven Walter\nNas Shefta    John Best\nMike Brennan    Mark Bottomley\nSteve Caslake"
  
  let currentLine = headerIndex + 1;
  
  // Look for the pattern of player names
  while (currentLine < dataLines.length) {
    const line = dataLines[currentLine];
    
    // Stop when we hit "GF GA" or home team section
    if (line.includes('GF') && line.includes('GA')) {
      break;
    }
    
    // Stop if we see score patterns (indicates we've moved to scoring section)
    if (line.match(/\d+\s*-\s*\d+/)) {
      break;
    }
    
    // Parse player names from this line
    // Look for multiple names separated by significant whitespace
    const playerNames = extractPlayerNamesFromLine(line);
    
    if (playerNames.length >= 2) {
      // Group players into pairs
      for (let i = 0; i < playerNames.length; i += 2) {
        if (i + 1 < playerNames.length && pairs.length < 3) {
          pairs.push({
            player1: playerNames[i],
            player2: playerNames[i + 1]
          });
        }
      }
    }
    
    currentLine++;
    
    // Stop after processing a reasonable number of lines
    if (currentLine - headerIndex > 5) break;
  }
  
  return pairs;
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
  const testText = `Fixtures - Market Weighton v Cawood 2
27 April 2025 - 10:00
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

  const result = parseLeagueMatchFromText(testText);
  console.log('Text Parse Result:', JSON.stringify(result, null, 2));
  return result;
};