// src/components/TrophyCabinet/TrophyCabinetTab.js
import React, { useState, useMemo } from 'react';
import { useTrophyCabinet } from '../../hooks/useTrophyCabinet';
import TrophyModal from './TrophyModal';
import TrophyDetailsModal from './TrophyDetailsModal';
import {
  Trophy,
  Plus,
  Search,
  Filter,
  Sparkles,
  Edit,
  Trash2
} from 'lucide-react';

const TrophyCabinetTab = ({
  currentUser,
  seasons = [],
  selectedSeason = null,
  allUsers = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeason, setFilterSeason] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showTrophyModal, setShowTrophyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingTrophy, setEditingTrophy] = useState(null);
  const [selectedTrophy, setSelectedTrophy] = useState(null);

  const { trophies, loading, error, addTrophy, updateTrophy, deleteTrophy } = useTrophyCabinet(currentUser?.id);

  // Filter trophies based on search and filters
  const filteredTrophies = useMemo(() => {
    return trophies.filter(trophy => {
      const matchesSearch = !searchTerm ||
        trophy.custom_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trophy.engraving_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trophy.winner1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trophy.winner2_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeason = filterSeason === 'all' || trophy.season_id === filterSeason;
      const matchesType = filterType === 'all' || trophy.trophy_type.includes(filterType);

      return matchesSearch && matchesSeason && matchesType;
    });
  }, [trophies, searchTerm, filterSeason, filterType]);

  // Simple trophy grid - no shelf grouping needed

  const handleTrophyClick = (trophy) => {
    setSelectedTrophy(trophy);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D1F1F]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading trophy cabinet: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg shadow-sm p-6 border border-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Trophy Cabinet</h1>
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-gray-600">Celebrating our champions and achievements</p>
          </div>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowTrophyModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#5D1F1F] to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Add Trophy
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search trophies, winners, or achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              />
            </div>
          </div>

          {/* Season Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterSeason}
              onChange={(e) => setFilterSeason(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            >
              <option value="all">All Seasons</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
          </div>

          {/* Trophy Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            >
              <option value="all">All Trophies</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
              <option value="cup">Cups</option>
              <option value="shield">Shields</option>
              <option value="star">Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trophy Display */}
      {filteredTrophies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trophies Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterSeason !== 'all' || filterType !== 'all'
                ? "No trophies match your search criteria."
                : "The trophy cabinet is empty. Start adding some achievements!"
              }
            </p>
            {currentUser?.role === 'admin' && !searchTerm && filterSeason === 'all' && filterType === 'all' && (
              <button
                onClick={() => setShowTrophyModal(true)}
                className="text-[#5D1F1F] hover:text-red-700 font-medium"
              >
                Add the first trophy →
              </button>
            )}
          </div>
        </div>
      ) : (
        <TrophyGrid
          trophies={filteredTrophies}
          onTrophyClick={handleTrophyClick}
          currentUser={currentUser}
          onEdit={(trophy) => {
            setEditingTrophy(trophy);
            setShowTrophyModal(true);
          }}
          onDelete={deleteTrophy}
        />
      )}

      {/* Trophy Add/Edit Modal */}
      <TrophyModal
        isOpen={showTrophyModal}
        onClose={() => {
          setShowTrophyModal(false);
          setEditingTrophy(null);
        }}
        onSave={async (trophyData) => {
          if (editingTrophy) {
            return await updateTrophy(editingTrophy.id, trophyData);
          } else {
            return await addTrophy(trophyData);
          }
        }}
        trophy={editingTrophy}
        seasons={seasons}
        allUsers={allUsers}
        currentUser={currentUser}
      />

      {/* Trophy Details Modal */}
      <TrophyDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTrophy(null);
        }}
        trophy={selectedTrophy}
        currentUser={currentUser}
        onEdit={(trophy) => {
          setEditingTrophy(trophy);
          setShowTrophyModal(true);
          setShowDetailsModal(false);
        }}
        onDelete={deleteTrophy}
      />
    </div>
  );
};

// Simple Trophy Grid Component
const TrophyGrid = ({ trophies, onTrophyClick, currentUser, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {trophies.map((trophy) => (
          <TrophyCard
            key={trophy.id}
            trophy={trophy}
            onClick={() => onTrophyClick(trophy)}
            currentUser={currentUser}
            onEdit={() => onEdit(trophy)}
            onDelete={() => onDelete(trophy.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Individual Trophy Card Component - Large and Clear Display
const TrophyCard = ({ trophy, onClick, currentUser, onEdit, onDelete }) => {
  return (
    <div className="relative group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-300">
      {/* Trophy Image */}
      <div
        className="aspect-square relative cursor-pointer overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
        onClick={onClick}
      >
        <OptimizedTrophyImage
          imageUrl={trophy.trophy_image_url}
          alt={`${trophy.custom_title || 'Trophy'} - ${trophy.winner1_name}`}
        />

        {/* Position Badge */}
        {trophy.position && trophy.position <= 3 && (
          <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
            trophy.position === 1 ? 'bg-yellow-500' :
            trophy.position === 2 ? 'bg-gray-400' :
            'bg-amber-600'
          }`}>
            {trophy.position}
          </div>
        )}


        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
          <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300 bg-white rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-medium text-gray-900">View Details</span>
          </div>
        </div>
      </div>

      {/* Trophy Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">
          {trophy.custom_title || getTrophyTitle(trophy.competition_type)}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {trophy.winner1_name}
          {trophy.winner2_name && ` & ${trophy.winner2_name}`}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{trophy.season_name}</span>
          <span>{new Date(trophy.awarded_date).getFullYear()}</span>
        </div>
      </div>

      {/* Admin Actions (Show on Hover) */}
      {currentUser?.role === 'admin' && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            title="Edit Trophy"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            title="Delete Trophy"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// Large Trophy Image Component - Optimized for Performance
const OptimizedTrophyImage = ({ imageUrl, alt = 'Trophy' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl || imageError) {
    // Fallback placeholder for missing or failed images
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border border-amber-200">
        <Trophy className="w-16 h-16 text-amber-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <Trophy className="w-12 h-12 text-gray-400" />
        </div>
      )}

      {/* Actual trophy image - Large and clear */}
      <img
        src={imageUrl}
        alt={alt}
        className={`w-full h-full object-contain transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
        style={{
          objectFit: 'contain',
          objectPosition: 'center'
        }}
      />
    </div>
  );
};

// Helper function for trophy titles
const getTrophyTitle = (competitionType) => {
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

  return titles[competitionType] || 'Champion';
};

export default TrophyCabinetTab;