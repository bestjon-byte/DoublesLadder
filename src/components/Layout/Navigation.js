// src/components/Layout/Navigation.js
import React from 'react';
import { Users, Calendar, Trophy, Settings } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, currentUser, ladderPlayers }) => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('ladder')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'ladder' 
                ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Ladder
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'matches' 
                ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Matches
          </button>
          {ladderPlayers?.find(player => player.id === currentUser?.id) && (
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'availability' 
                  ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Availability
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'admin' 
                  ? 'border-[#5D1F1F] text-[#5D1F1F]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Admin
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;