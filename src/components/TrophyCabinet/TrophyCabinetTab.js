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
  Sparkles
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

  // Group trophies into shelves (max 6 per shelf for visual appeal)
  const shelves = useMemo(() => {
    const trophiesPerShelf = 6;
    const groupedShelves = [];

    for (let i = 0; i < filteredTrophies.length; i += trophiesPerShelf) {
      groupedShelves.push(filteredTrophies.slice(i, i + trophiesPerShelf));
    }

    return groupedShelves;
  }, [filteredTrophies]);

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

      {/* Trophy Cabinet */}
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
        <TrophyCabinet
          shelves={shelves}
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

// Trophy Cabinet Component with Shelf Design
const TrophyCabinet = ({ shelves, onTrophyClick, currentUser, onEdit, onDelete }) => {
  return (
    <div className="trophy-cabinet">
      {/* Cabinet Background */}
      <div className="relative bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 rounded-lg shadow-2xl p-6 border-4 border-amber-700" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(160, 82, 45, 0.1) 0%, transparent 50%),
          linear-gradient(90deg, transparent 0%, rgba(139, 69, 19, 0.05) 50%, transparent 100%)
        `
      }}>

        {/* Cabinet Interior */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg p-4 min-h-[600px] border-2 border-amber-200 shadow-inner">

          {shelves.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-amber-600">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Cabinet is empty</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {shelves.map((shelf, shelfIndex) => (
                <TrophyShelf
                  key={shelfIndex}
                  trophies={shelf}
                  shelfIndex={shelfIndex}
                  onTrophyClick={onTrophyClick}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}

          {/* Glass effect overlay */}
          <div className="absolute inset-4 rounded-lg pointer-events-none bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-30"></div>
        </div>

        {/* Cabinet Hardware */}
        <div className="absolute top-4 right-4 w-3 h-8 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full shadow-md"></div>
        <div className="absolute top-4 left-4 w-3 h-8 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full shadow-md"></div>

        {/* Cabinet Legs */}
        <div className="absolute -bottom-2 left-8 w-4 h-4 bg-amber-800 rounded-full shadow-lg"></div>
        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-amber-800 rounded-full shadow-lg"></div>
      </div>
    </div>
  );
};

// Individual Shelf Component
const TrophyShelf = ({ trophies, shelfIndex, onTrophyClick, currentUser, onEdit, onDelete }) => {
  return (
    <div className="relative">
      {/* Shelf Surface */}
      <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border-t-4 border-amber-200 border-b-2 border-amber-300 shadow-lg rounded-sm mb-4">

        {/* Shelf Edge */}
        <div className="h-2 bg-gradient-to-r from-amber-200 to-amber-300 rounded-sm shadow-inner"></div>

        {/* Trophy Display Area */}
        <div className="flex items-end justify-around gap-2 p-4 min-h-[140px]">
          {trophies.map((trophy, index) => (
            <TrophyDisplay
              key={trophy.id}
              trophy={trophy}
              onClick={() => onTrophyClick(trophy)}
              currentUser={currentUser}
              onEdit={() => onEdit(trophy)}
              onDelete={() => onDelete(trophy.id)}
              size={index === Math.floor(trophies.length / 2) ? 'large' : 'medium'} // Center trophy slightly larger
            />
          ))}
        </div>

        {/* Shelf Reflection */}
        <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full mx-8"></div>
      </div>

      {/* Shelf Label */}
      <div className="text-center mb-2">
        <span className="text-xs text-amber-700 font-medium bg-amber-100 px-2 py-1 rounded-full">
          Shelf {shelfIndex + 1}
        </span>
      </div>
    </div>
  );
};

// Individual Trophy Display Component
const TrophyDisplay = ({ trophy, onClick, currentUser, onEdit, onDelete, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-16 h-20',
    medium: 'w-20 h-24',
    large: 'w-24 h-28'
  };

  return (
    <div className="relative group">
      {/* Trophy Container */}
      <div
        className={`${sizeClasses[size]} cursor-pointer transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:drop-shadow-xl flex flex-col items-center justify-end p-2`}
        onClick={onClick}
      >
        {/* Trophy Visual */}
        <div className="flex-1 flex items-end justify-center mb-1">
          <OptimizedTrophyImage
            imageUrl={trophy.trophy_image_url}
            size={size}
          />
        </div>

        {/* Trophy Nameplate */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs px-2 py-1 rounded-sm shadow-md transform perspective-500 rotateX-12 text-center min-h-[20px] flex items-center justify-center">
          <span className="font-semibold text-[10px] leading-tight truncate max-w-full">
            {trophy.winner1_name}
            {trophy.winner2_name && ` & ${trophy.winner2_name}`}
          </span>
        </div>

        {/* Position Badge */}
        {trophy.position <= 3 && (
          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
            trophy.position === 1 ? 'bg-yellow-500' :
            trophy.position === 2 ? 'bg-gray-400' :
            'bg-amber-600'
          }`}>
            {trophy.position}
          </div>
        )}

        {/* Featured Badge */}
        {trophy.is_featured && (
          <div className="absolute -top-1 -left-1">
            <Sparkles className="w-4 h-4 text-purple-600 drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* Admin Actions (Show on Hover) */}
      {currentUser?.role === 'admin' && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Optimized Trophy Image Component - Custom Images Only
const OptimizedTrophyImage = ({ imageUrl, size = 'medium' }) => {
  const [imageError, setImageError] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  if (!imageUrl || imageError) {
    // Fallback placeholder for missing or failed images
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-100 to-amber-200 rounded-lg flex items-center justify-center border-2 border-amber-300 shadow-lg`}>
        <Trophy className="w-8 h-8 text-amber-600" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading placeholder */}
      {!showImage && (
        <div className={`${sizeClasses[size]} bg-gray-200 animate-pulse rounded-lg flex items-center justify-center border-2 border-gray-300`}>
          <Trophy className="w-6 h-6 text-gray-400" />
        </div>
      )}

      {/* Actual trophy image */}
      <img
        src={imageUrl}
        alt="Trophy"
        className={`${sizeClasses[size]} object-contain rounded-lg shadow-lg transition-all duration-300 ${
          showImage ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        onLoad={() => setShowImage(true)}
        onError={() => setImageError(true)}
        loading="lazy"
        style={{
          filter: showImage ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
        }}
      />
    </div>
  );
};

export default TrophyCabinetTab;