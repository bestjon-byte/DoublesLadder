// Player Matching Utility for League Imports
// Handles fuzzy name matching between parsed league data and existing Cawood players

// Simple Levenshtein distance calculation for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Calculate similarity score (0-100, higher is better)
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return Math.round(((maxLength - distance) / maxLength) * 100);
};

// Find potential matches for a player name with cache support
export const findPlayerMatches = (playerName, existingPlayers, cachedMatches = []) => {
  if (!playerName || !existingPlayers || existingPlayers.length === 0) {
    return [];
  }
  
  // Check if we have a cached match for this exact name
  const cachedMatch = cachedMatches.find(cache => 
    cache.parsed_name.toLowerCase() === playerName.toLowerCase()
  );
  
  const firstLetter = playerName.charAt(0).toLowerCase();
  
  // Get all players whose name starts with the same first letter
  const matches = existingPlayers
    .filter(player => player.name.charAt(0).toLowerCase() === firstLetter)
    .map(player => ({
      player: player,
      score: 85, // Give a consistent score for display
      isExact: player.name.toLowerCase() === playerName.toLowerCase(),
      isCached: cachedMatch && cachedMatch.matched_player_id === player.id
    }))
    .sort((a, b) => {
      // Sort cached matches first, then exact matches, then alphabetically
      if (a.isCached && !b.isCached) return -1;
      if (!a.isCached && b.isCached) return 1;
      if (a.isExact && !b.isExact) return -1;
      if (!a.isExact && b.isExact) return 1;
      return a.player.name.localeCompare(b.player.name);
    });
  
  return matches;
};

// Get cached player matches from database
export const getCachedPlayerMatches = async (supabase) => {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('player_match_cache')
      .select(`
        parsed_name,
        matched_player_id,
        profiles:matched_player_id(id, name, email)
      `);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch cached player matches:', error);
    return [];
  }
};

// Save a confirmed player match to cache
export const saveCachedPlayerMatch = async (supabase, parsedName, matchedPlayerId, confirmedBy) => {
  if (!supabase || !parsedName || !matchedPlayerId) return false;
  
  try {
    const { error } = await supabase
      .from('player_match_cache')
      .upsert({
        parsed_name: parsedName,
        matched_player_id: matchedPlayerId,
        confirmed_by: confirmedBy,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'parsed_name,matched_player_id'
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to save cached player match:', error);
    return false;
  }
};

// Generate name variations for better matching
const generateNameVariations = (name) => {
  if (!name) return [];
  
  const variations = [name];
  const cleanName = name.trim();
  
  // Add the original clean name
  variations.push(cleanName);
  
  // Common nickname mappings
  const nicknameMap = {
    'john': ['jon', 'johnny', 'jack'],
    'jon': ['john', 'johnny', 'jack'],
    'michael': ['mike', 'mick', 'mickey'],
    'mike': ['michael', 'mick', 'mickey'],
    'mick': ['michael', 'mike', 'mickey'],
    'david': ['dave', 'davey'],
    'dave': ['david', 'davey'],
    'robert': ['rob', 'bob', 'bobby'],
    'rob': ['robert', 'bob', 'bobby'],
    'bob': ['robert', 'rob', 'bobby'],
    'william': ['will', 'bill', 'billy'],
    'will': ['william', 'bill', 'billy'],
    'bill': ['william', 'will', 'billy'],
    'richard': ['rick', 'rich', 'dick'],
    'rick': ['richard', 'rich', 'dick'],
    'christopher': ['chris', 'christie'],
    'chris': ['christopher', 'christie'],
    'anthony': ['tony', 'ant'],
    'tony': ['anthony', 'ant'],
    'matthew': ['matt', 'matty'],
    'matt': ['matthew', 'matty'],
    'andrew': ['andy', 'drew'],
    'andy': ['andrew', 'drew'],
    'steven': ['steve', 'stevie'],
    'steve': ['steven', 'stevie'],
    'stephen': ['steve', 'stevie'],
    'edward': ['ed', 'eddie', 'ted'],
    'ed': ['edward', 'eddie', 'ted'],
    'james': ['jim', 'jimmy', 'jamie'],
    'jim': ['james', 'jimmy', 'jamie'],
    'thomas': ['tom', 'tommy'],
    'tom': ['thomas', 'tommy']
  };
  
  const words = cleanName.toLowerCase().split(' ');
  
  words.forEach((word, index) => {
    if (nicknameMap[word]) {
      nicknameMap[word].forEach(nickname => {
        const newWords = [...words];
        newWords[index] = nickname;
        variations.push(newWords.join(' '));
        
        // Also add capitalized version
        variations.push(newWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      });
    }
  });
  
  // Add variations without middle initials or parts
  if (words.length > 2) {
    // First and last name only
    variations.push(`${words[0]} ${words[words.length - 1]}`);
    variations.push(`${words[0].charAt(0).toUpperCase() + words[0].slice(1)} ${words[words.length - 1].charAt(0).toUpperCase() + words[words.length - 1].slice(1)}`);
  }
  
  // Add just first name variations for partial matches
  if (words.length >= 1) {
    variations.push(words[0]); // Just first name
    variations.push(words[0].charAt(0).toUpperCase() + words[0].slice(1)); // Capitalized first name
  }
  
  // Add just last name if multiple words
  if (words.length > 1) {
    variations.push(words[words.length - 1]); // Just last name
    variations.push(words[words.length - 1].charAt(0).toUpperCase() + words[words.length - 1].slice(1)); // Capitalized last name
  }
  
  // Remove duplicates and return
  return [...new Set(variations)];
};

// Determine which players are Cawood players based on team names
export const identifyCawoodPlayers = (parsedData) => {
  if (!parsedData) return { cawoodPlayers: [], opponentPlayers: [], opponentClub: null };
  
  const { homeTeam, awayTeam, homeTeamPairs, awayTeamPairs } = parsedData;
  
  let cawoodPlayers = [];
  let opponentPlayers = [];
  let opponentClub = null;
  
  // Check if Cawood is home or away team
  const cawoodIsHome = homeTeam && homeTeam.toLowerCase().includes('cawood');
  const cawoodIsAway = awayTeam && awayTeam.toLowerCase().includes('cawood');
  
  if (cawoodIsHome) {
    // Cawood is home team
    opponentClub = awayTeam;
    cawoodPlayers = homeTeamPairs?.flatMap(pair => [pair.player1, pair.player2]) || [];
    opponentPlayers = awayTeamPairs?.flatMap(pair => [pair.player1, pair.player2]) || [];
  } else if (cawoodIsAway) {
    // Cawood is away team
    opponentClub = homeTeam;
    cawoodPlayers = awayTeamPairs?.flatMap(pair => [pair.player1, pair.player2]) || [];
    opponentPlayers = homeTeamPairs?.flatMap(pair => [pair.player1, pair.player2]) || [];
  } else {
    // Fallback: assume away team is Cawood (most common scenario)
    opponentClub = homeTeam;
    cawoodPlayers = awayTeamPairs?.flatMap(pair => [pair.player1, pair.player2]) || [];
    opponentPlayers = homeTeamPairs?.flatMap(pair => [pair.player1, pair.player2]) || [];
  }
  
  // Remove duplicates and filter out empty names
  cawoodPlayers = [...new Set(cawoodPlayers.filter(name => name && name.trim()))];
  opponentPlayers = [...new Set(opponentPlayers.filter(name => name && name.trim()))];
  
  return {
    cawoodPlayers,
    opponentPlayers,
    opponentClub,
    cawoodIsHome
  };
};

// Format email for new dummy users
export const generateDummyEmail = (name) => {
  if (!name) return 'unknown@cawood.dummy';
  
  const cleanName = name.toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-letters except spaces
    .trim()
    .split(' ')
    .filter(part => part.length > 0)
    .join('.');
  
  return `${cleanName}@cawood.dummy`;
};

export default {
  findPlayerMatches,
  identifyCawoodPlayers,
  generateDummyEmail,
  calculateSimilarity,
  getCachedPlayerMatches,
  saveCachedPlayerMatch
};