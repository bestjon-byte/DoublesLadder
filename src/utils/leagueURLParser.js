// League Match URL Parser
// Fetches and parses match data directly from York Men's Tennis League website

export const parseLeagueMatchFromURL = async (url) => {
  try {
    // Validate URL
    if (!url.includes('yorkmenstennisleague.co.uk')) {
      throw new Error('Please provide a valid York Men\'s Tennis League URL');
    }

    // Use a CORS proxy to fetch the webpage content
    // Try multiple proxy services for reliability
    const corsProxies = [
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/get?url='
    ];
    
    let response;
    let lastError;
    
    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        response = await fetch(proxyUrl);
        if (response.ok) break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`Failed to fetch match data. CORS blocked or network error: ${lastError?.message || 'Unknown error'}`);
    }

    let html = await response.text();
    
    // Some proxies return JSON, extract the HTML content
    try {
      const jsonResponse = JSON.parse(html);
      if (jsonResponse.contents) {
        html = jsonResponse.contents;
      } else if (jsonResponse.data) {
        html = jsonResponse.data;
      }
    } catch (e) {
      // Not JSON, use as-is
    }
    
    // Create a DOM parser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract match information from the webpage
    const matchData = extractMatchDataFromHTML(doc);

    return {
      success: true,
      data: matchData
    };

  } catch (error) {
    console.error('Error parsing league match from URL:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

const extractMatchDataFromHTML = (doc) => {
  // Extract date and time
  const dateElement = doc.querySelector('.match-date, .fixture-date, h2, h3');
  let matchDate = null;
  let matchTime = null;

  if (dateElement) {
    const dateText = dateElement.textContent;
    const dateMatch = dateText.match(/(\d{1,2}\s+\w+\s+\d{4})/);
    const timeMatch = dateText.match(/(\d{1,2}:\d{2})/);
    
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        matchDate = parsedDate.toISOString().split('T')[0];
      }
    }
    if (timeMatch) {
      matchTime = timeMatch[1];
    }
  }

  // Extract team names
  const teamElements = doc.querySelectorAll('.team-name, .club-name, h2, h3');
  let homeTeam = '';
  let awayTeam = '';

  for (const element of teamElements) {
    const text = element.textContent.trim();
    if (text.includes('v') || text.includes('vs')) {
      const teams = text.split(/\s+v[s]?\s+/);
      if (teams.length === 2) {
        homeTeam = teams[0].trim();
        awayTeam = teams[1].trim();
        break;
      }
    }
  }

  // If we didn't find teams in vs format, look for separate team headings
  if (!homeTeam || !awayTeam) {
    const possibleTeams = Array.from(teamElements)
      .map(el => el.textContent.trim())
      .filter(text => 
        text.length > 0 && 
        !text.includes('Match') && 
        !text.includes('Result') &&
        !text.includes(':') &&
        text.length < 50
      );

    if (possibleTeams.length >= 2) {
      homeTeam = possibleTeams[0];
      awayTeam = possibleTeams[1];
    }
  }

  // Extract match results - look for table structure or score patterns
  const pairs = extractMatchPairs(doc);

  return {
    matchDate,
    matchTime,
    homeTeam: homeTeam || 'Home Team',
    awayTeam: awayTeam || 'Away Team',
    pairs,
    source: 'url'
  };
};

const extractMatchPairs = (doc) => {
  const pairs = [];

  // Strategy 1: Look for table structure
  const tables = doc.querySelectorAll('table');
  
  for (const table of tables) {
    const rows = table.querySelectorAll('tr');
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      
      // Look for rows with player names and scores
      if (cells.length >= 5) {
        const scorePattern = /(\d+)\s*[-–]\s*(\d+)/g;
        const rowText = row.textContent;
        const scores = [...rowText.matchAll(scorePattern)];
        
        if (scores.length >= 3) {
          // This row contains match results
          const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
          
          // Try to identify player names (usually in first few columns)
          const playerCells = cellTexts.slice(0, 4).filter(text => 
            text.length > 0 && 
            !scorePattern.test(text) &&
            isNaN(parseInt(text))
          );

          let homePlayer1 = '', homePlayer2 = '', awayPlayer1 = '', awayPlayer2 = '';
          
          if (playerCells.length >= 2) {
            homePlayer1 = playerCells[0];
            awayPlayer1 = playerCells[1];
          }
          if (playerCells.length >= 4) {
            homePlayer2 = playerCells[2];
            awayPlayer2 = playerCells[3];
          }

          // Extract rubber scores
          const rubber1 = { home: parseInt(scores[0][1]), away: parseInt(scores[0][2]) };
          const rubber2 = { home: parseInt(scores[1][1]), away: parseInt(scores[1][2]) };
          const rubber3 = { home: parseInt(scores[2][1]), away: parseInt(scores[2][2]) };

          pairs.push({
            pairNumber: pairs.length + 1,
            homePlayer1: homePlayer1 || `Home Player ${pairs.length * 2 + 1}`,
            homePlayer2: homePlayer2 || `Home Player ${pairs.length * 2 + 2}`,
            awayPlayer1: awayPlayer1 || `Away Player ${pairs.length * 2 + 1}`,
            awayPlayer2: awayPlayer2 || `Away Player ${pairs.length * 2 + 2}`,
            rubbers: [rubber1, rubber2, rubber3],
            totalGames: { home: 0, away: 0 }
          });
        }
      }
    }
  }

  // Strategy 2: Look for div-based structure if no table found
  if (pairs.length === 0) {
    const scoreElements = doc.querySelectorAll('*');
    
    for (const element of scoreElements) {
      const text = element.textContent;
      const scorePattern = /(\d+)\s*[-–]\s*(\d+)/g;
      const scores = [...text.matchAll(scorePattern)];
      
      if (scores.length >= 3) {
        // Found a section with 3 scores - this might be a match pair
        const rubber1 = { home: parseInt(scores[0][1]), away: parseInt(scores[0][2]) };
        const rubber2 = { home: parseInt(scores[1][1]), away: parseInt(scores[1][2]) };
        const rubber3 = { home: parseInt(scores[2][1]), away: parseInt(scores[2][2]) };

        // Try to find player names in nearby elements
        const parent = element.parentElement;
        const siblings = parent ? Array.from(parent.children) : [];
        const playerNames = [];

        for (const sibling of siblings) {
          const siblingText = sibling.textContent.trim();
          if (siblingText && 
              !scorePattern.test(siblingText) &&
              siblingText.length > 2 &&
              siblingText.length < 30 &&
              isNaN(parseInt(siblingText))) {
            playerNames.push(siblingText);
          }
        }

        pairs.push({
          pairNumber: pairs.length + 1,
          homePlayer1: playerNames[0] || `Home Player ${pairs.length * 2 + 1}`,
          homePlayer2: playerNames[1] || `Home Player ${pairs.length * 2 + 2}`,
          awayPlayer1: playerNames[2] || `Away Player ${pairs.length * 2 + 1}`,
          awayPlayer2: playerNames[3] || `Away Player ${pairs.length * 2 + 2}`,
          rubbers: [rubber1, rubber2, rubber3],
          totalGames: { home: 0, away: 0 }
        });
      }
    }
  }

  return pairs.slice(0, 3); // Limit to 3 pairs max
};

// Test function for development
export const testURLParser = async () => {
  const testURL = 'https://www.yorkmenstennisleague.co.uk/fixtures/339';
  const result = await parseLeagueMatchFromURL(testURL);
  console.log('URL Parse Result:', JSON.stringify(result, null, 2));
  return result;
};