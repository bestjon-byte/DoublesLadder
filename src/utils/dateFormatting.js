/**
 * Date formatting utilities for responsive displays
 * Provides different date formats for mobile vs desktop screens
 */

/**
 * Format date for display - responsive version
 * @param {string|Date} dateString - Date to format
 * @param {boolean} isCompact - Use compact format (for mobile)
 * @returns {string} Formatted date string
 */
export const formatDateResponsive = (dateString, isCompact = false) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '';
  }

  if (isCompact) {
    // Mobile: "Mon 15 Nov" or "Mon 15 Nov '23"
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  // Desktop: "Monday 15 November 2023"
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format date without year for recent dates
 * @param {string|Date} dateString - Date to format
 * @param {boolean} isCompact - Use compact format
 * @returns {string} Formatted date string
 */
export const formatDateNoYear = (dateString, isCompact = false) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '';
  }

  if (isCompact) {
    // Mobile: "Mon 15 Nov"
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  // Desktop: "Monday 15 November"
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

/**
 * Format date in shortest form (for tables/cards)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '';
  }

  // "15 Nov 2023"
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {boolean} isCompact - Use compact format
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, isCompact = false) => {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '';
  }

  const formatOptions = isCompact
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'long', year: 'numeric' };

  return `${start.toLocaleDateString('en-GB', formatOptions)} - ${end.toLocaleDateString('en-GB', formatOptions)}`;
};
