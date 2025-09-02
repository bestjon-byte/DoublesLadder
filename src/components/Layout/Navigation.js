// src/components/Layout/Navigation.js
import React from 'react';
import { Users, Calendar, Trophy, Settings, User } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, currentUser, ladderPlayers }) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('ladder')}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 ${
              activeTab === 'ladder' 
                ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ladder</span>
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 ${
              activeTab === 'matches' 
                ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Matches</span>
          </button>
          {ladderPlayers?.find(player => player.id === currentUser?.id) && (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 ${
                  activeTab === 'profile' 
                    ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 ${
                  activeTab === 'availability' 
                    ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Available</span>
              </button>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 ${
                activeTab === 'admin' 
                  ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;