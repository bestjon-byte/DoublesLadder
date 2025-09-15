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
      <div className="relative p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100 min-h-[140px] flex items-center justify-center">
        <TrophyIcon type={trophy.trophy_type} size="extra-large" imageUrl={trophy.trophy_image_url} />
        
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
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-lg p-2 mb-3">
            <h3 className="font-bold text-gray-900 text-sm trophy-engraving leading-tight">
              {trophy.custom_title || getTrophyTitle(trophy.competition_type)}
            </h3>
            {trophy.engraving_text && (
              <p className="text-xs text-gray-700 italic trophy-engraving mt-1 leading-tight">
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
      <TrophyIcon type={trophy.trophy_type} size="large" imageUrl={trophy.trophy_image_url} />
      <div className="flex-1">
        <h3 className="font-bold text-base text-gray-900 trophy-engraving leading-tight">
          {trophy.custom_title || getTrophyTitle(trophy.competition_type)}
        </h3>
        <p className="text-gray-700 font-medium">
          {trophy.winner1_name}
          {trophy.winner2_name && ` & ${trophy.winner2_name}`}
        </p>
        <p className="text-sm text-gray-600">{trophy.season_name}</p>
        {trophy.engraving_text && (
          <p className="text-sm text-gray-700 italic mt-2 trophy-engraving leading-tight">
            "{trophy.engraving_text}"
          </p>
        )}
      </div>
    </div>
  </div>
);

// Trophy Icon Component with CSS-based graphics and custom images
const TrophyIcon = ({ type, size = 'medium', imageUrl = null }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    'extra-large': 'w-32 h-32'
  };

  // If it's a custom image type and we have an image URL, display the custom image
  if (type === 'custom_image' && imageUrl) {
    return (
      <div className="trophy-glow">
        <img 
          src={imageUrl} 
          alt="Custom trophy" 
          className={`${sizeClasses[size]} object-contain rounded-lg shadow-sm`}
        />
      </div>
    );
  }

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

// Realistic SVG Trophy Components
const GoldCup = ({ className }) => {
  const gradientId = `goldGradient-${Math.random().toString(36).substr(2, 9)}`;
  const baseId = `goldBase-${Math.random().toString(36).substr(2, 9)}`;
  const highlightId = `goldHighlight-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
        <stop offset="25%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
        <stop offset="75%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id={baseId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
      </linearGradient>
      <radialGradient id={highlightId}>
        <stop offset="0%" style={{ stopColor: '#FFFACD', stopOpacity: 0.8 }} />
        <stop offset="100%" style={{ stopColor: '#FFFACD', stopOpacity: 0 }} />
      </radialGradient>
    </defs>
    
    {/* Trophy Base */}
    <rect x="25" y="105" width="50" height="10" rx="5" fill={`url(#${baseId})`} stroke="#8B7355" strokeWidth="1"/>
    
    {/* Trophy Stem */}
    <rect x="45" y="85" width="10" height="20" fill={`url(#${baseId})`} stroke="#8B7355" strokeWidth="0.5"/>
    
    {/* Trophy Bowl */}
    <ellipse cx="50" cy="45" rx="30" ry="25" fill={`url(#${gradientId})`} stroke="#B8860B" strokeWidth="1"/>
    <ellipse cx="50" cy="40" rx="25" ry="20" fill="none" stroke="#FFD700" strokeWidth="0.5" opacity="0.7"/>
    
    {/* Trophy Handles */}
    <ellipse cx="25" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    <ellipse cx="75" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    
    {/* Highlight */}
    <ellipse cx="42" cy="35" rx="8" ry="6" fill={`url(#${highlightId})`}/>
    
    {/* Decorative band */}
    <rect x="25" y="55" width="50" height="4" fill="#B8860B" opacity="0.3"/>
  </svg>
  );
};

const SilverCup = ({ className }) => {
  const gradientId = `silverGradient-${Math.random().toString(36).substr(2, 9)}`;
  const baseId = `silverBase-${Math.random().toString(36).substr(2, 9)}`;
  const highlightId = `silverHighlight-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#E5E5E5', stopOpacity: 1 }} />
        <stop offset="25%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#F5F5F5', stopOpacity: 1 }} />
        <stop offset="75%" style={{ stopColor: '#A9A9A9', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id={baseId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#A9A9A9', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#808080', stopOpacity: 1 }} />
      </linearGradient>
      <radialGradient id={highlightId}>
        <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.8 }} />
        <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
      </radialGradient>
    </defs>
    
    <rect x="25" y="105" width="50" height="10" rx="5" fill={`url(#${baseId})`} stroke="#808080" strokeWidth="1"/>
    <rect x="45" y="85" width="10" height="20" fill={`url(#${baseId})`} stroke="#808080" strokeWidth="0.5"/>
    <ellipse cx="50" cy="45" rx="30" ry="25" fill={`url(#${gradientId})`} stroke="#A9A9A9" strokeWidth="1"/>
    <ellipse cx="50" cy="40" rx="25" ry="20" fill="none" stroke="#E5E5E5" strokeWidth="0.5" opacity="0.7"/>
    <ellipse cx="25" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    <ellipse cx="75" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    <ellipse cx="42" cy="35" rx="8" ry="6" fill={`url(#${highlightId})`}/>
    <rect x="25" y="55" width="50" height="4" fill="#A9A9A9" opacity="0.3"/>
  </svg>
  );
};

const BronzeCup = ({ className }) => {
  const gradientId = `bronzeGradient-${Math.random().toString(36).substr(2, 9)}`;
  const baseId = `bronzeBase-${Math.random().toString(36).substr(2, 9)}`;
  const highlightId = `bronzeHighlight-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#CD7F32', stopOpacity: 1 }} />
        <stop offset="25%" style={{ stopColor: '#B87333', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#D2691E', stopOpacity: 1 }} />
        <stop offset="75%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id={baseId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#B87333', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
      </linearGradient>
      <radialGradient id={highlightId}>
        <stop offset="0%" style={{ stopColor: '#DEB887', stopOpacity: 0.6 }} />
        <stop offset="100%" style={{ stopColor: '#DEB887', stopOpacity: 0 }} />
      </radialGradient>
    </defs>
    
    <rect x="25" y="105" width="50" height="10" rx="5" fill={`url(#${baseId})`} stroke="#8B4513" strokeWidth="1"/>
    <rect x="45" y="85" width="10" height="20" fill={`url(#${baseId})`} stroke="#8B4513" strokeWidth="0.5"/>
    <ellipse cx="50" cy="45" rx="30" ry="25" fill={`url(#${gradientId})`} stroke="#A0522D" strokeWidth="1"/>
    <ellipse cx="50" cy="40" rx="25" ry="20" fill="none" stroke="#D2691E" strokeWidth="0.5" opacity="0.7"/>
    <ellipse cx="25" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    <ellipse cx="75" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    <ellipse cx="42" cy="35" rx="8" ry="6" fill={`url(#${highlightId})`}/>
    <rect x="25" y="55" width="50" height="4" fill="#A0522D" opacity="0.3"/>
  </svg>
  );
};

const GoldShield = ({ className }) => {
  const gradientId = `goldShieldGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M50 10 L20 25 L20 70 Q20 90 50 110 Q80 90 80 70 L80 25 Z" 
          fill={`url(#${gradientId})`} stroke="#B8860B" strokeWidth="2"/>
    <path d="M50 20 L30 30 L30 65 Q30 80 50 95 Q70 80 70 65 L70 30 Z" 
          fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.6"/>
    <circle cx="50" cy="50" r="15" fill="#B8860B" opacity="0.3"/>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#DAA520"/>
  </svg>
  );
};

const SilverShield = ({ className }) => {
  const gradientId = `silverShieldGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#E5E5E5', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#A9A9A9', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M50 10 L20 25 L20 70 Q20 90 50 110 Q80 90 80 70 L80 25 Z" 
          fill={`url(#${gradientId})`} stroke="#808080" strokeWidth="2"/>
    <path d="M50 20 L30 30 L30 65 Q30 80 50 95 Q70 80 70 65 L70 30 Z" 
          fill="none" stroke="#E5E5E5" strokeWidth="1" opacity="0.6"/>
    <circle cx="50" cy="50" r="15" fill="#808080" opacity="0.3"/>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#A9A9A9"/>
  </svg>
  );
};

const BronzeShield = ({ className }) => {
  const gradientId = `bronzeShieldGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#CD7F32', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#B87333', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M50 10 L20 25 L20 70 Q20 90 50 110 Q80 90 80 70 L80 25 Z" 
          fill={`url(#${gradientId})`} stroke="#8B4513" strokeWidth="2"/>
    <path d="M50 20 L30 30 L30 65 Q30 80 50 95 Q70 80 70 65 L70 30 Z" 
          fill="none" stroke="#D2691E" strokeWidth="1" opacity="0.6"/>
    <circle cx="50" cy="50" r="15" fill="#8B4513" opacity="0.3"/>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#A0522D"/>
  </svg>
  );
};

const GoldStar = ({ className }) => {
  const gradientId = `goldStarGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <polygon points="50,15 61,40 85,40 67,55 73,80 50,65 27,80 33,55 15,40 39,40"
             fill={`url(#${gradientId})`} stroke="#B8860B" strokeWidth="2"/>
    <polygon points="50,25 58,45 75,45 62,55 66,72 50,62 34,72 38,55 25,45 42,45"
             fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.6"/>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#DAA520"/>
  </svg>
  );
};

const SilverStar = ({ className }) => {
  const gradientId = `silverStarGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#E5E5E5', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#A9A9A9', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <polygon points="50,15 61,40 85,40 67,55 73,80 50,65 27,80 33,55 15,40 39,40"
             fill={`url(#${gradientId})`} stroke="#808080" strokeWidth="2"/>
    <polygon points="50,25 58,45 75,45 62,55 66,72 50,62 34,72 38,55 25,45 42,45"
             fill="none" stroke="#E5E5E5" strokeWidth="1" opacity="0.6"/>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#A9A9A9"/>
  </svg>
  );
};

const BronzeStar = ({ className }) => {
  const gradientId = `bronzeStarGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#CD7F32', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#B87333', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <polygon points="50,15 61,40 85,40 67,55 73,80 50,65 27,80 33,55 15,40 39,40"
             fill={`url(#${gradientId})`} stroke="#8B4513" strokeWidth="2"/>
    <polygon points="50,25 58,45 75,45 62,55 66,72 50,62 34,72 38,55 25,45 42,45"
             fill="none" stroke="#D2691E" strokeWidth="1" opacity="0.6"/>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#A0522D"/>
  </svg>
  );
};

const DiamondCup = ({ className }) => {
  const gradientId = `diamondGradient-${Math.random().toString(36).substr(2, 9)}`;
  const sparkleId = `diamondSparkle-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#E0E6FF', stopOpacity: 1 }} />
        <stop offset="25%" style={{ stopColor: '#B4C7FF', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#F0F8FF', stopOpacity: 1 }} />
        <stop offset="75%" style={{ stopColor: '#9BB5FF', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#6495ED', stopOpacity: 1 }} />
      </linearGradient>
      <radialGradient id={sparkleId}>
        <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#E0E6FF', stopOpacity: 0.8 }} />
        <stop offset="100%" style={{ stopColor: '#6495ED', stopOpacity: 0.6 }} />
      </radialGradient>
    </defs>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#6495ED"/>
    <rect x="45" y="85" width="10" height="20" fill="#6495ED"/>
    <ellipse cx="50" cy="45" rx="30" ry="25" fill={`url(#${gradientId})`} stroke="#4682B4" strokeWidth="1"/>
    <ellipse cx="50" cy="40" rx="25" ry="20" fill="none" stroke="#E0E6FF" strokeWidth="0.5" opacity="0.8"/>
    <ellipse cx="25" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    <ellipse cx="75" cy="50" rx="8" ry="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4"/>
    <ellipse cx="42" cy="35" rx="8" ry="6" fill={`url(#${sparkleId})`}/>
    <circle cx="35" cy="40" r="2" fill="#FFFFFF" opacity="0.9"/>
    <circle cx="60" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8"/>
    <circle cx="55" cy="55" r="1" fill="#FFFFFF" opacity="0.7"/>
  </svg>
  );
};

const PlatinumShield = ({ className }) => {
  const gradientId = `platinumGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
  <svg className={className} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#E5E4E2', stopOpacity: 1 }} />
        <stop offset="25%" style={{ stopColor: '#C9C0BB', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#F7F7F7', stopOpacity: 1 }} />
        <stop offset="75%" style={{ stopColor: '#B8B8B8', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#989898', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M50 10 L20 25 L20 70 Q20 90 50 110 Q80 90 80 70 L80 25 Z" 
          fill={`url(#${gradientId})`} stroke="#808080" strokeWidth="2"/>
    <path d="M50 20 L30 30 L30 65 Q30 80 50 95 Q70 80 70 65 L70 30 Z" 
          fill="none" stroke="#F7F7F7" strokeWidth="1" opacity="0.7"/>
    <circle cx="50" cy="50" r="15" fill="#989898" opacity="0.3"/>
    <rect x="25" y="105" width="50" height="10" rx="5" fill="#989898"/>
    <circle cx="45" cy="40" r="2" fill="#FFFFFF" opacity="0.8"/>
  </svg>
  );
};

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