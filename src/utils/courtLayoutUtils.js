// src/utils/courtLayoutUtils.js
// Utility functions for generating court layout permutations

/**
 * Generate all valid court layout permutations for a given number of players
 * Courts can have 4 or 5 players each for rotation purposes
 *
 * @param {number} numPlayers - Total number of players
 * @returns {Array<Array<number>>} Array of court layouts (each layout is an array of court sizes)
 *
 * Examples:
 *   9 players  → [[4, 5], [5, 4]]
 *   13 players → [[4, 4, 5], [4, 5, 4], [5, 4, 4]]
 *   14 players → [[4, 5, 5], [5, 4, 5], [5, 5, 4]]
 */
export const generateCourtLayoutPermutations = (numPlayers) => {
  // Handle simple cases
  if (numPlayers % 4 === 0) {
    // All courts with 4 players - no permutations needed
    const numCourts = numPlayers / 4;
    return [Array(numCourts).fill(4)];
  }

  if (numPlayers % 5 === 0) {
    // All courts with 5 players - no permutations needed
    const numCourts = numPlayers / 5;
    return [Array(numCourts).fill(5)];
  }

  if (numPlayers === 5) {
    // Single court with 5 players
    return [[5]];
  }

  // For mixed cases, find all valid combinations of 4s and 5s
  const validCombinations = [];

  // Try different numbers of courts with 4 players
  const maxCourtsOf4 = Math.floor(numPlayers / 4);

  for (let courtsOf4 = 0; courtsOf4 <= maxCourtsOf4; courtsOf4++) {
    const remaining = numPlayers - (courtsOf4 * 4);

    // Check if remaining players can be distributed in courts of 5
    if (remaining % 5 === 0) {
      const courtsOf5 = remaining / 5;

      // Create base layout: courtsOf4 times 4, courtsOf5 times 5
      const baseLayout = [
        ...Array(courtsOf4).fill(4),
        ...Array(courtsOf5).fill(5)
      ];

      // Generate all unique permutations of this layout
      const permutations = generateUniquePermutations(baseLayout);
      validCombinations.push(...permutations);
    }
  }

  // If no valid combinations found, return empty array
  return validCombinations.length > 0 ? validCombinations : [];
};

/**
 * Generate all unique permutations of an array
 * @param {Array<number>} arr - Array to permute
 * @returns {Array<Array<number>>} Array of unique permutations
 */
const generateUniquePermutations = (arr) => {
  if (arr.length <= 1) return [arr];

  const permutations = [];
  const used = new Set();

  const permute = (current, remaining) => {
    if (remaining.length === 0) {
      const key = current.join(',');
      if (!used.has(key)) {
        used.add(key);
        permutations.push([...current]);
      }
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      const next = [...current, remaining[i]];
      const nextRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
      permute(next, nextRemaining);
    }
  };

  permute([], arr);
  return permutations;
};

/**
 * Get a descriptive label for a court layout
 * @param {Array<number>} layout - Court layout array (e.g., [4, 5])
 * @param {number} index - Index of this layout option
 * @returns {string} Descriptive label
 */
export const getLayoutLabel = (layout, index) => {
  const layoutStr = layout.join('-');

  // Add descriptive names for common patterns
  const courts = layout.length;
  const has4s = layout.includes(4);
  const has5s = layout.includes(5);

  if (!has4s && has5s) {
    return `Option ${index + 1}: All 5-player courts (${layoutStr})`;
  }

  if (has4s && !has5s) {
    return `Option ${index + 1}: All 4-player courts (${layoutStr})`;
  }

  // Mixed layout - describe which courts are larger
  const firstCourtSize = layout[0];
  const lastCourtSize = layout[layout.length - 1];

  if (firstCourtSize > lastCourtSize) {
    return `Option ${index + 1}: Top-heavy (${layoutStr})`;
  } else if (firstCourtSize < lastCourtSize) {
    return `Option ${index + 1}: Bottom-heavy (${layoutStr})`;
  } else {
    return `Option ${index + 1}: Balanced (${layoutStr})`;
  }
};

/**
 * Apply a court layout to a sorted list of players
 * @param {Array<Object>} sortedPlayers - Players sorted by ranking/ELO
 * @param {Array<number>} layout - Court layout (e.g., [4, 5])
 * @returns {Array<Array<Object>>} Array of courts (each court is an array of players)
 */
export const applyCourtLayout = (sortedPlayers, layout) => {
  const courts = [];
  let playerIndex = 0;

  for (const courtSize of layout) {
    courts.push(sortedPlayers.slice(playerIndex, playerIndex + courtSize));
    playerIndex += courtSize;
  }

  return courts;
};
