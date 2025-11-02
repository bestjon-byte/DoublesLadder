// AdminActionMenu - Dropdown menu for admin match actions
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, MessageCircle, Plus, Undo2 } from 'lucide-react';
import { haptics } from '../../utils/haptics';

const AdminActionMenu = ({
  match,
  matchStatus,
  stats,
  courtFixtures,
  isSeasonCompleted,
  seasonType,
  onGenerateClick,
  onUndoClick,
  onWhatsAppClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Determine which actions to show
  const showWhatsApp = seasonType === 'ladder';
  const showGenerate = !isSeasonCompleted && matchStatus === 'future-no-fixtures' && stats.available >= 4;
  const showUndo = !isSeasonCompleted && courtFixtures.length > 0 && matchStatus !== 'completed';

  // If no actions available, don't render
  if (!showWhatsApp && !showGenerate && !showUndo) {
    return null;
  }

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    haptics.tap();
    setIsOpen(!isOpen);
  };

  const handleAction = (e, actionFn) => {
    e.stopPropagation();
    setIsOpen(false);
    actionFn();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={handleMenuToggle}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'bg-gray-200 text-gray-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label="Admin actions"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* WhatsApp Action */}
          {showWhatsApp && (
            <button
              onClick={(e) => handleAction(e, onWhatsAppClick)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span>Share on WhatsApp</span>
            </button>
          )}

          {/* Generate Matches Action */}
          {showGenerate && (
            <button
              onClick={(e) => handleAction(e, onGenerateClick)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm"
            >
              <Plus className="w-4 h-4 text-[#5D1F1F]" />
              <div className="flex items-center justify-between flex-1">
                <span>Generate Matches</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {stats.available}
                </span>
              </div>
            </button>
          )}

          {/* Undo Action */}
          {showUndo && (
            <button
              onClick={(e) => handleAction(e, onUndoClick)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm text-orange-600"
            >
              <Undo2 className="w-4 h-4" />
              <span>Undo Generated Matches</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminActionMenu;
