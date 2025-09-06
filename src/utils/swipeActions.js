// src/utils/swipeActions.js - Swipe gesture utilities for mobile interactions

import { haptics } from './haptics';

/**
 * Configuration for different types of swipe actions
 */
export const SwipeDirection = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down'
};

export const SwipeThreshold = {
  DISTANCE: 80,    // Minimum distance to register a swipe
  VELOCITY: 0.5,   // Minimum velocity for swipe detection
  TIME: 300        // Maximum time for gesture to be considered a swipe
};

/**
 * Custom hook for handling swipe gestures
 * @param {Object} handlers - Object containing swipe handlers { onSwipeLeft, onSwipeRight, etc. }
 * @param {Object} options - Configuration options
 * @returns {Object} - Touch event handlers to attach to element
 */
export const useSwipeGestures = (handlers = {}, options = {}) => {
  const threshold = { ...SwipeThreshold, ...options };
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isSwiping = false;

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    isSwiping = false;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX);
      const deltaY = Math.abs(touch.clientY - touchStartY);
      
      // If we've moved more than 10px, consider this a potential swipe
      if (deltaX > 10 || deltaY > 10) {
        isSwiping = true;
      }
    }
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;
    
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);
    const velocity = Math.max(distanceX, distanceY) / deltaTime;

    // Check if this qualifies as a swipe
    if (deltaTime < threshold.TIME && velocity > threshold.VELOCITY) {
      // Horizontal swipe
      if (distanceX > distanceY && distanceX > threshold.DISTANCE) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          haptics.tap();
          handlers.onSwipeRight(e);
          e.preventDefault();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          haptics.tap();
          handlers.onSwipeLeft(e);
          e.preventDefault();
        }
      }
      // Vertical swipe
      else if (distanceY > distanceX && distanceY > threshold.DISTANCE) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          haptics.tap();
          handlers.onSwipeDown(e);
          e.preventDefault();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          haptics.tap();
          handlers.onSwipeUp(e);
          e.preventDefault();
        }
      }
    }

    // Reset tracking variables
    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
    isSwiping = false;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: {
      touchAction: 'pan-y', // Allow vertical scrolling but capture horizontal swipes
      userSelect: 'none'    // Prevent text selection during swipes
    }
  };
};

/**
 * Swipeable card component wrapper
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Swipeable card wrapper
 */
export const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  leftAction, 
  rightAction,
  className = "",
  disabled = false,
  ...props 
}) => {
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: disabled ? null : onSwipeLeft,
    onSwipeRight: disabled ? null : onSwipeRight
  });

  return (
    <div 
      className={`relative ${className}`}
      {...swipeHandlers}
      {...props}
    >
      {/* Left action hint */}
      {!disabled && leftAction && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-start pl-4 pointer-events-none z-10">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm opacity-0 transform translate-x-4 transition-all duration-200 group-swipe-right:opacity-100 group-swipe-right:translate-x-0">
            {leftAction}
          </div>
        </div>
      )}
      
      {/* Right action hint */}
      {!disabled && rightAction && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 pointer-events-none z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm opacity-0 transform -translate-x-4 transition-all duration-200 group-swipe-left:opacity-100 group-swipe-left:translate-x-0">
            {rightAction}
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

/**
 * Quick action swipe patterns for tennis app
 */
export const TennisSwipeActions = {
  // Swipe right on match to quickly enter score
  QUICK_SCORE: {
    direction: SwipeDirection.RIGHT,
    icon: '🎾',
    label: 'Score',
    color: 'bg-green-500'
  },
  
  // Swipe left on match to view details
  VIEW_DETAILS: {
    direction: SwipeDirection.LEFT,
    icon: '👁️',
    label: 'View',
    color: 'bg-blue-500'
  },
  
  // Swipe up to challenge score
  CHALLENGE: {
    direction: SwipeDirection.UP,
    icon: '⚠️',
    label: 'Challenge',
    color: 'bg-orange-500'
  }
};

export default {
  useSwipeGestures,
  SwipeableCard,
  TennisSwipeActions,
  SwipeDirection,
  SwipeThreshold
};