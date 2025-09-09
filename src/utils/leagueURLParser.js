// League Match URL Parser - New Implementation
// Parses York Men's Tennis League match results from URLs

export const parseLeagueMatchFromURL = async (url) => {
  try {
    // Validate URL
    if (!url.includes('yorkmenstennisleague.co.uk')) {
      throw new Error('Please provide a valid York Men\'s Tennis League URL');
    }

    // Use CORS proxy directly since direct fetch will be blocked
    const corsProxies = [
      'https://api.allorigins.win/get?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.codetabs.com/v1/proxy?quest='
    ];
    
    let html = null;
    let lastError = null;
    
    // Try each CORS proxy
    for (const proxy of corsProxies) {
      try {
        console.log(`Trying CORS proxy: ${proxy}`);
        const proxyUrl = proxy + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let responseData = await response.text();
        
        // Handle different proxy response formats
        if (proxy.includes('allorigins')) {
          try {
            const jsonData = JSON.parse(responseData);
            html = jsonData.contents;
          } catch (e) {
            // If not JSON, use as-is
            html = responseData;
          }
        } else {
          html = responseData;
        }
        
        // If we got HTML, break out of the loop
        if (html && html.length > 100) {
          console.log('Successfully fetched HTML content');
          break;
        }
        
      } catch (error) {
        console.warn(`CORS proxy ${proxy} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    if (!html) {
      throw new Error(`All CORS proxies failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    
    return parseHTMLContent(html);

  } catch (error) {
    console.error('Error parsing league match from URL:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

const parseHTMLContent = (html) => {
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract match date and time
    const { matchDate, matchTime } = extractDateTime(doc);
    
    // Extract team names
    const { homeTeam, awayTeam } = extractTeamNames(doc);
    
    // Extract the scoring matrix
    const matchData = extractScoringMatrix(doc, homeTeam, awayTeam);

    return {
      success: true,
      data: {
        matchDate,
        matchTime,
        homeTeam,
        awayTeam,
        ...matchData
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

const extractDateTime = (doc) => {
  // Look for date/time pattern like "27 April 2025 - 10:00"
  const textContent = doc.body.textContent || '';
  const dateTimeMatch = textContent.match(/(\d{1,2}\s+\w+\s+\d{4})\s*-\s*(\d{1,2}:\d{2})/);
  
  let matchDate = null;
  let matchTime = null;
  
  if (dateTimeMatch) {
    const [, dateStr, timeStr] = dateTimeMatch;
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      matchDate = parsedDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    }
    matchTime = timeStr;
  }
  
  return { matchDate, matchTime };
};

const extractTeamNames = (doc) => {
  // Look for team names - typically in headings or prominent text
  const textContent = doc.body.textContent || '';
  
  // Pattern 1: Look for "Team A v Team B" or "Team A vs Team B"
  let homeTeam = '';
  let awayTeam = '';
  
  const vsMatch = textContent.match(/([^v\n]+?)\s+v[s]?\s+([^v\n]+?)(?:\n|$)/i);
  if (vsMatch) {
    homeTeam = vsMatch[1].trim();
    awayTeam = vsMatch[2].trim();
  }
  
  // If not found, look for patterns in the HTML structure
  if (!homeTeam || !awayTeam) {
    // Try to find team names from table headers or prominent elements
    const headings = doc.querySelectorAll('h1, h2, h3, th, .team-name');
    const teamCandidates = [];
    
    headings.forEach(element => {
      const text = element.textContent.trim();
      if (text && text.length > 3 && text.length < 50 && 
          !text.includes('Match') && !text.includes('Result') && 
          !text.includes('GF') && !text.includes('GA')) {
        teamCandidates.push(text);
      }
    });
    
    // Look for Cawood in candidates
    const cawoodCandidate = teamCandidates.find(name => name.includes('Cawood'));
    const otherCandidate = teamCandidates.find(name => !name.includes('Cawood') && name !== cawoodCandidate);
    
    if (cawoodCandidate && otherCandidate) {
      // Determine which is home/away based on typical league structure
      // Usually the non-Cawood team is listed first (home)
      homeTeam = otherCandidate;
      awayTeam = cawoodCandidate;
    }
  }
  
  return { homeTeam, awayTeam };
};

const extractScoringMatrix = (doc) => {
  // Look for the table structure containing the scoring matrix
  const tables = doc.querySelectorAll('table');
  
  for (const table of tables) {
    const matrixData = tryParseTable(table);
    if (matrixData.success) {
      return matrixData.data;
    }
  }
  
  // If no table found, try parsing from structured text
  return parseFromStructuredText(doc);
};

const tryParseTable = (table) => {
  try {
    const rows = table.querySelectorAll('tr');
    if (rows.length < 4) return { success: false }; // Need header + 3 data rows minimum
    
    // Extract data from table
    const homeTeamPairs = [];
    const awayTeamPairs = [];
    const scores = [];
    
    // Parse table structure
    let headerRow = null;
    const dataRows = [];
    
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 4) { // Need at least team name + 3 scores
        if (index === 0 || row.querySelector('th')) {
          headerRow = cells;
        } else {
          dataRows.push(cells);
        }
      }
    });
    
    if (!headerRow || dataRows.length < 3) {
      return { success: false };
    }
    
    // Parse header to get away team pairs
    for (let i = 1; i < headerRow.length - 1; i++) { // Skip first (team name) and last (totals)
      const cellText = headerRow[i].textContent.trim();
      if (cellText && !cellText.includes('GF') && !cellText.includes('GA')) {
        // Parse player names - might be on separate lines
        const players = parsePlayerNames(cellText);
        if (players.length >= 2) {
          awayTeamPairs.push({
            player1: players[0],
            player2: players[1]
          });
        }
      }
    }
    
    // Parse data rows for home team pairs and scores
    dataRows.forEach((row, rowIndex) => {
      if (rowIndex >= 3) return; // Only process first 3 pairs
      
      const cells = Array.from(row);
      
      // First cell contains home team pair names
      const homeTeamCell = cells[0].textContent.trim();
      const homePlayers = parsePlayerNames(homeTeamCell);
      if (homePlayers.length >= 2) {
        homeTeamPairs.push({
          player1: homePlayers[0],
          player2: homePlayers[1]
        });
      }
      
      // Next 3 cells contain scores against away team pairs
      const rowScores = [];
      for (let i = 1; i <= 3 && i < cells.length; i++) {
        const scoreText = cells[i].textContent.trim();
        const scoreMatch = scoreText.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
          rowScores.push({
            homeScore: parseInt(scoreMatch[1]),
            awayScore: parseInt(scoreMatch[2])
          });
        }
      }
      scores.push(rowScores);
    });
    
    return {
      success: true,
      data: {
        homeTeamPairs,
        awayTeamPairs,
        scoringMatrix: scores
      }
    };
    
  } catch (error) {
    return { success: false };
  }
};

const parseFromStructuredText = (doc) => {
  // Fallback parsing from structured text content
  const textContent = doc.body.textContent || '';
  const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);
  
  // This would need to be implemented based on the specific text structure
  // For now, return empty structure
  return {
    homeTeamPairs: [],
    awayTeamPairs: [],
    scoringMatrix: []
  };
};

const parsePlayerNames = (text) => {
  // Handle different formats of player names
  // Could be "Player1 Player2" or "Player1\nPlayer2" or other variations
  
  // Clean up the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Try different splitting strategies
  let players = [];
  
  // Strategy 1: Split by common separators
  if (cleanText.includes('&')) {
    players = cleanText.split('&').map(p => p.trim());
  } else if (cleanText.includes('\n')) {
    players = cleanText.split('\n').map(p => p.trim()).filter(p => p);
  } else {
    // Strategy 2: Split by multiple spaces or assume two names
    const words = cleanText.split(/\s+/);
    if (words.length >= 4) {
      // Assume first two words are player 1, last two are player 2
      const midPoint = Math.floor(words.length / 2);
      players = [
        words.slice(0, midPoint).join(' '),
        words.slice(midPoint).join(' ')
      ];
    } else if (words.length >= 2) {
      // Try to split by finding where second name starts (capital letter)
      let splitIndex = -1;
      for (let i = 2; i < words.length; i++) {
        if (words[i].charAt(0) === words[i].charAt(0).toUpperCase()) {
          splitIndex = i;
          break;
        }
      }
      
      if (splitIndex > 0) {
        players = [
          words.slice(0, splitIndex).join(' '),
          words.slice(splitIndex).join(' ')
        ];
      }
    }
  }
  
  return players.filter(p => p && p.length > 1);
};

// Test function for development
export const testURLParser = async () => {
  const testURL = 'https://www.yorkmenstennisleague.co.uk/fixtures/339';
  console.log('Testing URL parser...');
  const result = await parseLeagueMatchFromURL(testURL);
  console.log('Parse Result:', JSON.stringify(result, null, 2));
  return result;
};