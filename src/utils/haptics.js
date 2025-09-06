// src/utils/haptics.js - Haptic feedback utilities for mobile devices

/**
 * Provides haptic feedback for different types of interactions
 * Falls back gracefully on devices that don't support haptics
 */

export const HapticFeedbackType = {
  // Light feedback for subtle interactions
  LIGHT: 'light',
  // Medium feedback for standard interactions  
  MEDIUM: 'medium',
  // Heavy feedback for important actions
  HEAVY: 'heavy',
  // Success feedback for completed actions
  SUCCESS: 'success',
  // Warning feedback for caution actions
  WARNING: 'warning',
  // Error feedback for failed actions
  ERROR: 'error'
};

/**
 * Triggers haptic feedback if supported by the device
 * @param {string} type - Type of haptic feedback (from HapticFeedbackType)
 * @param {Object} options - Additional options
 */
export const triggerHaptic = (type = HapticFeedbackType.LIGHT, options = {}) => {
  try {
    // Check if the device supports haptic feedback
    if (!navigator.vibrate && !window.navigator.vibrate) {
      return false;
    }

    // Check for iOS haptic engine (more sophisticated)
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS devices with haptic engine
      if (navigator.vibrate) {
        switch (type) {
          case HapticFeedbackType.LIGHT:
            navigator.vibrate(10);
            break;
          case HapticFeedbackType.MEDIUM:
            navigator.vibrate(20);
            break;
          case HapticFeedbackType.HEAVY:
            navigator.vibrate(40);
            break;
          case HapticFeedbackType.SUCCESS:
            navigator.vibrate([10, 50, 10]);
            break;
          case HapticFeedbackType.WARNING:
            navigator.vibrate([20, 100, 20]);
            break;
          case HapticFeedbackType.ERROR:
            navigator.vibrate([50, 50, 50]);
            break;
          default:
            navigator.vibrate(15);
        }
        return true;
      }
    } else {
      // Android and other devices with standard vibration API
      if (navigator.vibrate) {
        switch (type) {
          case HapticFeedbackType.LIGHT:
            navigator.vibrate(25);
            break;
          case HapticFeedbackType.MEDIUM:
            navigator.vibrate(50);
            break;
          case HapticFeedbackType.HEAVY:
            navigator.vibrate(75);
            break;
          case HapticFeedbackType.SUCCESS:
            navigator.vibrate([25, 25, 25]);
            break;
          case HapticFeedbackType.WARNING:
            navigator.vibrate([50, 50, 50]);
            break;
          case HapticFeedbackType.ERROR:
            navigator.vibrate([100, 50, 100]);
            break;
          default:
            navigator.vibrate(30);
        }
        return true;
      }
    }
  } catch (error) {
    console.warn('Haptic feedback not supported or failed:', error);
  }
  
  return false;
};

/**
 * Convenience functions for common haptic feedback scenarios
 */
export const haptics = {
  // Subtle feedback for UI interactions
  tap: () => triggerHaptic(HapticFeedbackType.LIGHT),
  
  // Standard feedback for button presses
  click: () => triggerHaptic(HapticFeedbackType.MEDIUM),
  
  // Strong feedback for important actions
  impact: () => triggerHaptic(HapticFeedbackType.HEAVY),
  
  // Positive feedback for successful actions
  success: () => triggerHaptic(HapticFeedbackType.SUCCESS),
  
  // Cautionary feedback
  warning: () => triggerHaptic(HapticFeedbackType.WARNING),
  
  // Negative feedback for errors
  error: () => triggerHaptic(HapticFeedbackType.ERROR),
  
  // Custom pattern
  pattern: (pattern) => {
    try {
      if (navigator.vibrate && Array.isArray(pattern)) {
        navigator.vibrate(pattern);
        return true;
      }
    } catch (error) {
      console.warn('Custom haptic pattern failed:', error);
    }
    return false;
  }
};

/**
 * Enhanced button wrapper that adds haptic feedback
 * @param {Function} onClick - Original click handler
 * @param {string} hapticType - Type of haptic feedback
 * @returns {Function} - Enhanced click handler with haptic feedback
 */
export const withHaptic = (onClick, hapticType = HapticFeedbackType.MEDIUM) => {
  return (event) => {
    // Trigger haptic feedback first
    triggerHaptic(hapticType);
    
    // Then execute the original onClick handler
    if (onClick) {
      onClick(event);
    }
  };
};

export default haptics;