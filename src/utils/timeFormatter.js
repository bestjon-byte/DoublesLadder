/**
 * Converts time from 24-hour format (e.g., "18:00:00" or "18:00")
 * to 12-hour format (e.g., "6pm")
 * @param {string} time - Time string in format HH:MM:SS or HH:MM
 * @returns {string} Formatted time like "6pm" or "10:30am"
 */
export const formatTime = (time) => {
  if (!time) return '';

  // Extract hours and minutes from time string
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours)) return time; // Return original if parsing fails

  // Convert to 12-hour format
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight

  // Only show minutes if they're not :00
  if (minutes && minutes !== 0) {
    return `${displayHours}:${minutesStr}${period}`;
  }

  return `${displayHours}${period}`;
};

/**
 * Get color classes for session type badges
 * @param {string} sessionType - The session type (Adults, Juniors, Beginners)
 * @returns {object} Object with background and text color classes
 */
export const getSessionTypeColors = (sessionType) => {
  switch (sessionType) {
    case 'Juniors':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200'
      };
    case 'Adults':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200'
      };
    case 'Beginners':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200'
      };
  }
};
