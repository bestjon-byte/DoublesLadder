// src/components/TrophyCabinet/TrophyDetailsModal.js
import React, { useState } from 'react';
import {
  X,
  Trophy,
  Calendar,
  Users,
  Award,
  Sparkles,
  Edit,
  Trash2,
  Star
} from 'lucide-react';

const TrophyDetailsModal = ({ isOpen, onClose, trophy, currentUser, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [showImage, setShowImage] = useState(false);

  if (!isOpen || !trophy) return null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this trophy? This action cannot be undone.')) {
      const result = await onDelete(trophy.id);
      if (result.success) {
        onClose();
      }
    }
  };

  const getTrophyTitle = () => {
    if (trophy.custom_title) return trophy.custom_title;

    const titles = {
      singles_winner: 'Singles Champion',
      doubles_winner: 'Doubles Champion',
      league_winner: 'League Winner',
      tournament_winner: 'Tournament Winner',
      best_player: 'Player of the Season',
      most_improved: 'Most Improved Player',
      sportsmanship: 'Sportsmanship Award',
      participation: 'Participation Award',
      season_champion: 'Season Champion',
      custom: 'Special Achievement'
    };

    return titles[trophy.competition_type] || 'Champion';
  };

  const getPositionBadge = () => {
    if (!trophy.position || trophy.position > 3) return null;

    const positions = {
      1: { bg: 'bg-yellow-500', text: '🥇 1st Place' },
      2: { bg: 'bg-gray-400', text: '🥈 2nd Place' },
      3: { bg: 'bg-amber-600', text: '🥉 3rd Place' }
    };

    const pos = positions[trophy.position];
    return (
      <div className={`${pos.bg} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg`}>
        {pos.text}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{getTrophyTitle()}</h2>
              <p className="text-amber-100">Trophy Details</p>
            </div>
          </div>

          {/* Featured badge */}
          {trophy.is_featured && (
            <div className="absolute top-4 left-4">
              <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Featured
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Trophy Image */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {!showImage && !imageError && trophy.trophy_image_url && (
                  <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {trophy.trophy_image_url && !imageError ? (
                  <img
                    src={trophy.trophy_image_url}
                    alt="Trophy"
                    className={`w-48 h-48 object-contain rounded-lg shadow-xl transition-opacity duration-300 ${
                      showImage ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                    onLoad={() => setShowImage(true)}
                    onError={() => setImageError(true)}
                    style={{
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
                    }}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-lg flex items-center justify-center border-4 border-amber-300 shadow-xl">
                    <Trophy className="w-16 h-16 text-amber-600" />
                  </div>
                )}
              </div>

              {/* Position Badge */}
              <div className="mb-4">
                {getPositionBadge()}
              </div>

              {/* Engraving */}
              {trophy.engraving_text && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-lg p-4 text-center shadow-md">
                  <h4 className="font-semibold text-amber-800 mb-2">Engraving</h4>
                  <p className="text-amber-700 italic font-medium leading-relaxed">
                    "{trophy.engraving_text}"
                  </p>
                </div>
              )}
            </div>

            {/* Trophy Information */}
            <div className="space-y-4">

              {/* Winners */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Winners</h3>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-blue-800">{trophy.winner1_name}</div>
                  {trophy.winner2_name && (
                    <div className="font-medium text-blue-800">{trophy.winner2_name}</div>
                  )}
                </div>
              </div>

              {/* Season & Date */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Event Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="text-green-800">
                    <span className="font-medium">Season:</span> {trophy.season_name}
                  </div>
                  <div className="text-green-800">
                    <span className="font-medium">Date:</span> {new Date(trophy.awarded_date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Competition Type */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Achievement</h3>
                </div>
                <div className="text-purple-800">
                  {trophy.competition_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Special Achievement'}
                </div>
              </div>

            </div>
          </div>

          {/* Admin Actions */}
          {currentUser?.role === 'admin' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => onEdit(trophy)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Trophy
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Trophy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrophyDetailsModal;