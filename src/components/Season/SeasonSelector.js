import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getSeasonDisplayInfo } from '../../utils/helpers';

const SeasonSelector = ({ 
  seasons, 
  selectedSeason, 
  onSeasonSelect,
  loading 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🎾';
      case 'completed': return '🏆';
      case 'archived': return '📁';
      default: return '📅';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'archived': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading || !selectedSeason) {
    return (
      <div className="bg-gray-100 rounded-lg px-4 py-2 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 transition-colors shadow-sm"
      >
        <img 
          src="/club-logo.png" 
          alt="Cawood Tennis Club" 
          className="w-8 h-8 object-contain flex-shrink-0"
          onError={(e) => {
            e.target.src = '/c-ball.png';
            e.target.className = 'w-6 h-6 object-contain flex-shrink-0';
          }}
        />
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900 truncate">{selectedSeason.name}</div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeasonDisplayInfo(selectedSeason).badgeColor}`}>
              {getSeasonDisplayInfo(selectedSeason).badge}
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {getSeasonDisplayInfo(selectedSeason).subtitle}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center justify-between px-2 py-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Select Season
                </h3>
                <div className="text-xs text-gray-500">
                  {seasons?.filter(s => s.status === 'active').length || 0} active
                </div>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {/* NEW: Group active seasons first, then completed */}
              {seasons
                ?.sort((a, b) => {
                  // Primary sort: Active seasons first
                  if (a.status === 'active' && b.status !== 'active') return -1;
                  if (b.status === 'active' && a.status !== 'active') return 1;
                  // Secondary sort: Within same status, sort by most recent
                  return new Date(b.start_date) - new Date(a.start_date);
                })
                .map((season) => {
                  const seasonInfo = getSeasonDisplayInfo(season);
                  return (
                    <button
                      key={season.id}
                      onClick={() => {
                        onSeasonSelect(season);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${
                        season.id === selectedSeason.id 
                          ? 'border-[#5D1F1F] bg-[#5D1F1F]/5' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span>{getStatusIcon(season.status)}</span>
                          <span className="font-medium text-gray-900">{season.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${seasonInfo.badgeColor}`}>
                            {seasonInfo.badge}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(season.status)}`}>
                          {season.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <div className="mb-1">{seasonInfo.subtitle}</div>
                        <div className="flex items-center space-x-2">
                          <span>{new Date(season.start_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{season.player_count} players</span>
                          <span>•</span>
                          <span>{season.match_count} {season.season_type === 'league' ? 'matches' : 'matches'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
            
            {seasons?.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No seasons available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SeasonSelector;