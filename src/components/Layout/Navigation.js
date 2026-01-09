// src/components/Layout/Navigation.js
import React from 'react';
import { Users, Calendar, Trophy, Settings, User, Award, GraduationCap } from 'lucide-react';
import { haptics } from '../../utils/haptics';

const Navigation = ({ activeTab, setActiveTab, currentUser, ladderPlayers, selectedSeason }) => {
  const isLeagueSeason = selectedSeason?.season_type === 'league';
  const isCoach = currentUser?.role === 'coach';

  // Coaches get a simplified navigation - just their dashboard
  if (isCoach) {
    return (
      <>
        {/* Desktop Navigation - Minimal for coach */}
        <nav className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex">
              <button
                className="flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 border-[#5D1F1F] text-[#5D1F1F] min-h-[60px] flex items-center"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Coach Dashboard
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation - Minimal for coach */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex">
            <button
              className="flex-1 flex flex-col items-center justify-center py-2 min-h-[64px] text-[#5D1F1F] bg-red-50"
              style={{ touchAction: 'manipulation' }}
            >
              <GraduationCap className="w-6 h-6 mb-1 text-[#5D1F1F]" />
              <span className="text-xs font-medium text-[#5D1F1F]">Coach</span>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5D1F1F]"></div>
            </button>
          </div>
        </nav>
      </>
    );
  }

  const tabs = [
    { id: 'ladder', icon: Trophy, label: 'League', show: true }, // RENAMED: Ladder → League
    { id: 'matches', icon: Calendar, label: 'Matches', show: true },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      show: ladderPlayers?.find(player => player.id === currentUser?.id)
    },
    {
      id: 'trophies',
      icon: Award,
      label: 'Trophies',
      show: true
    },
    {
      id: 'availability',
      icon: Users,
      label: 'Available',
      show: !isLeagueSeason && ladderPlayers?.find(player => player.id === currentUser?.id) // Hide for league seasons
    },
    {
      id: 'coaching',
      icon: GraduationCap,
      label: 'Coaching',
      show: true // Coaching is open to all users
    },
    {
      id: 'admin',
      icon: Settings,
      label: 'Admin',
      show: currentUser?.role === 'admin'
    }
  ].filter(tab => tab.show);

  return (
    <>
      {/* Desktop Navigation - Top */}
      <nav className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  haptics.tap(); // Light haptic for tab navigation
                  setActiveTab(id);
                }}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 min-h-[60px] flex items-center ${
                  activeTab === id 
                    ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                haptics.tap(); // Light haptic for mobile tab navigation
                setActiveTab(id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[64px] transition-colors ${
                activeTab === id 
                  ? 'text-[#5D1F1F] bg-red-50' 
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Icon className={`w-6 h-6 mb-1 ${activeTab === id ? 'text-[#5D1F1F]' : ''}`} />
              <span className={`text-xs font-medium ${activeTab === id ? 'text-[#5D1F1F]' : ''}`}>
                {label}
              </span>
              {activeTab === id && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5D1F1F]"></div>
              )}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navigation;