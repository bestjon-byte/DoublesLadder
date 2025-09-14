// src/components/TrophyCabinet/TrophyCabinetTab.js
import React, { useState, useEffect } from 'react';
import { useTrophyCabinet } from '../../hooks/useTrophyCabinet';
import TrophyModal from './TrophyModal';
import { 
  Trophy, 
  Award, 
  Star, 
  Shield, 
  Crown,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
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
  const [editingTrophy, setEditingTrophy] = useState(null);
  
  const { trophies, loading, error, addTrophy, updateTrophy, deleteTrophy } = useTrophyCabinet(currentUser?.id);

  // Filter trophies based on search and filters
  const filteredTrophies = trophies.filter(trophy => {
    const matchesSearch = !searchTerm || 
      trophy.custom_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trophy.engraving_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trophy.winner1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trophy.winner2_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeason = filterSeason === 'all' || trophy.season_id === filterSeason;
    const matchesType = filterType === 'all' || trophy.trophy_type.includes(filterType);
    
    return matchesSearch && matchesSeason && matchesType;
  });

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
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg shadow-sm p-6 border border-yellow-200">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrophies.map(trophy => (
            <TrophyCard 
              key={trophy.id} 
              trophy={trophy} 
              allUsers={allUsers}
              currentUser={currentUser}
              onEdit={() => {
                setEditingTrophy(trophy);
                setShowTrophyModal(true);
              }}
              onDelete={() => deleteTrophy(trophy.id)}
            />
          ))}
        </div>
      )}

      {/* Featured Trophy Showcase */}
      {filteredTrophies.some(t => t.is_featured) && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm p-6 border border-purple-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            Featured Achievements
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTrophies.filter(t => t.is_featured).map(trophy => (
              <FeaturedTrophyCard key={trophy.id} trophy={trophy} allUsers={allUsers} />
            ))}
          </div>
        </div>
      )}

      {/* Trophy Modal */}
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
    </div>
  );
};

// Individual Trophy Card Component
const TrophyCard = ({ trophy, allUsers, currentUser, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Trophy Visual */}
      <div className="relative p-6 text-center bg-gradient-to-br from-gray-50 to-gray-100">
        <TrophyIcon type={trophy.trophy_type} size="large" />
        
        {/* Position Badge */}
        {trophy.position <= 3 && (
          <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
            trophy.position === 1 ? 'bg-yellow-500' :
            trophy.position === 2 ? 'bg-gray-400' :
            'bg-amber-600'
          }`}>
            {trophy.position}
          </div>
        )}

        {/* Featured Badge */}
        {trophy.is_featured && (
          <div className="absolute top-2 left-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
        )}
      </div>

      {/* Trophy Details */}
      <div className="p-4">
        <div className="text-center mb-3">
          {/* Engraved Title */}
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-gray-900 text-lg trophy-engraving">
              {trophy.custom_title || getTrophyTitle(trophy.competition_type)}
            </h3>
            {trophy.engraving_text && (
              <p className="text-sm text-gray-700 italic trophy-engraving mt-1">
                "{trophy.engraving_text}"
              </p>
            )}
          </div>

          {/* Winners */}
          <div className="flex items-center justify-center gap-1 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">
              {trophy.winner1_name}
              {trophy.winner2_name && ` & ${trophy.winner2_name}`}
            </span>
          </div>

          {/* Season & Date */}
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{trophy.season_name} - {new Date(trophy.awarded_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Admin Actions */}
        {currentUser?.role === 'admin' && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex-1 text-xs bg-blue-50 text-blue-700 py-2 px-3 rounded hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex-1 text-xs bg-red-50 text-red-700 py-2 px-3 rounded hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Featured Trophy Card Component
const FeaturedTrophyCard = ({ trophy, allUsers }) => (
  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-6 shadow-lg">
    <div className="flex items-center gap-4">
      <TrophyIcon type={trophy.trophy_type} size="medium" />
      <div className="flex-1">
        <h3 className="font-bold text-lg text-gray-900 trophy-engraving">
          {trophy.custom_title || getTrophyTitle(trophy.competition_type)}
        </h3>
        <p className="text-gray-700 font-medium">
          {trophy.winner1_name}
          {trophy.winner2_name && ` & ${trophy.winner2_name}`}
        </p>
        <p className="text-sm text-gray-600">{trophy.season_name}</p>
        {trophy.engraving_text && (
          <p className="text-sm text-gray-700 italic mt-2 trophy-engraving">
            "{trophy.engraving_text}"
          </p>
        )}
      </div>
    </div>
  </div>
);

// Trophy Icon Component with CSS-based graphics
const TrophyIcon = ({ type, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  const getTrophyComponent = () => {
    switch (type) {
      case 'gold_cup':
      case 'champion_cup':
        return <GoldCup className={sizeClasses[size]} />;
      case 'silver_cup':
      case 'runner_up_cup':
        return <SilverCup className={sizeClasses[size]} />;
      case 'bronze_cup':
      case 'participation_cup':
        return <BronzeCup className={sizeClasses[size]} />;
      case 'gold_shield':
        return <GoldShield className={sizeClasses[size]} />;
      case 'silver_shield':
        return <SilverShield className={sizeClasses[size]} />;
      case 'bronze_shield':
        return <BronzeShield className={sizeClasses[size]} />;
      case 'gold_star':
        return <GoldStar className={sizeClasses[size]} />;
      case 'silver_star':
        return <SilverStar className={sizeClasses[size]} />;
      case 'bronze_star':
        return <BronzeStar className={sizeClasses[size]} />;
      case 'diamond_cup':
        return <DiamondCup className={sizeClasses[size]} />;
      case 'platinum_shield':
        return <PlatinumShield className={sizeClasses[size]} />;
      default:
        return <Trophy className={`${sizeClasses[size]} text-yellow-500`} />;
    }
  };

  return <div className="trophy-glow">{getTrophyComponent()}</div>;
};

// CSS-based Trophy Components
const GoldCup = ({ className }) => (
  <div className={`${className} mx-auto golden-trophy relative`}>
    <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 rounded-t-full shadow-lg"></div>
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/4 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-sm shadow-inner"></div>
    <div className="absolute top-1/4 left-0 w-1/4 h-1/3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-l-full shadow-inner"></div>
    <div className="absolute top-1/4 right-0 w-1/4 h-1/3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-r-full shadow-inner"></div>
  </div>
);

const SilverCup = ({ className }) => (
  <div className={`${className} mx-auto silver-trophy relative`}>
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 rounded-t-full shadow-lg"></div>
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/4 bg-gradient-to-br from-gray-300 to-gray-500 rounded-sm shadow-inner"></div>
    <div className="absolute top-1/4 left-0 w-1/4 h-1/3 bg-gradient-to-br from-gray-200 to-gray-400 rounded-l-full shadow-inner"></div>
    <div className="absolute top-1/4 right-0 w-1/4 h-1/3 bg-gradient-to-br from-gray-200 to-gray-400 rounded-r-full shadow-inner"></div>
  </div>
);

const BronzeCup = ({ className }) => (
  <div className={`${className} mx-auto bronze-trophy relative`}>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 rounded-t-full shadow-lg"></div>
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/4 bg-gradient-to-br from-amber-700 to-orange-600 rounded-sm shadow-inner"></div>
    <div className="absolute top-1/4 left-0 w-1/4 h-1/3 bg-gradient-to-br from-amber-600 to-orange-500 rounded-l-full shadow-inner"></div>
    <div className="absolute top-1/4 right-0 w-1/4 h-1/3 bg-gradient-to-br from-amber-600 to-orange-500 rounded-r-full shadow-inner"></div>
  </div>
);

const GoldShield = ({ className }) => (
  <Shield className={`${className} text-yellow-400 drop-shadow-lg`} fill="currentColor" />
);

const SilverShield = ({ className }) => (
  <Shield className={`${className} text-gray-400 drop-shadow-lg`} fill="currentColor" />
);

const BronzeShield = ({ className }) => (
  <Shield className={`${className} text-amber-600 drop-shadow-lg`} fill="currentColor" />
);

const GoldStar = ({ className }) => (
  <Star className={`${className} text-yellow-400 drop-shadow-lg`} fill="currentColor" />
);

const SilverStar = ({ className }) => (
  <Star className={`${className} text-gray-400 drop-shadow-lg`} fill="currentColor" />
);

const BronzeStar = ({ className }) => (
  <Star className={`${className} text-amber-600 drop-shadow-lg`} fill="currentColor" />
);

const DiamondCup = ({ className }) => (
  <div className={`${className} mx-auto diamond-trophy relative`}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-300 rounded-t-full shadow-lg diamond-sparkle"></div>
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/4 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-sm shadow-inner"></div>
    <div className="absolute top-1/4 left-0 w-1/4 h-1/3 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-l-full shadow-inner"></div>
    <div className="absolute top-1/4 right-0 w-1/4 h-1/3 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-r-full shadow-inner"></div>
  </div>
);

const PlatinumShield = ({ className }) => (
  <Shield className={`${className} text-slate-300 drop-shadow-lg`} fill="currentColor" />
);

// Helper function to get default trophy titles
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