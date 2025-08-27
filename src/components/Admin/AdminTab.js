// src/components/Admin/AdminTab.js - DEBUG VERSION
import React, { useState } from 'react';
import { Check } from 'lucide-react';

// COMMENT OUT THIS LINE TO TEST IF IT'S THE IMPORT CAUSING ISSUES
// import ScoreChallengesSection from './ScoreChallengesSection';

const AdminTab = ({ 
  users, 
  currentUser,
  currentSeason,
  approveUser, 
  addToLadder, 
  fetchUsers,
  setPlayerAvailability,
  getPlayerAvailability,
  getAvailabilityStats,
  clearOldMatches,
  matchFixtures,
  matchResults
}) => {
  const [loading, setLoading] = useState(false);

  console.log('🔍 DEBUG AdminTab props:', {
    usersCount: users?.length,
    currentUser: currentUser?.name,
    currentSeason: currentSeason?.name,
    matchResults: matchResults?.length,
    matchFixtures: matchFixtures?.length
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      
      {/* DEBUG SECTION - Should always show */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800">🔧 DEBUG INFO</h3>
        <p>Users: {users?.length || 0}</p>
        <p>Current User: {currentUser?.name || 'None'}</p>
        <p>Match Results: {matchResults?.length || 0}</p>
        <p>Match Fixtures: {matchFixtures?.length || 0}</p>
        <p>Admin Role: {currentUser?.role === 'admin' ? 'YES' : 'NO'}</p>
      </div>

      {/* TEMP PLACEHOLDER FOR SCORE MANAGEMENT */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800">📊 Score Management (PLACEHOLDER)</h3>
        <p>This is where ScoreChallengesSection should appear</p>
        <p>If you see this, the AdminTab is loading correctly</p>
      </div>

      {/* Rest of your existing AdminTab content... */}
      
      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
        {users.filter(u => u.status === 'pending').length > 0 ? (
          <div className="space-y-3">
            {users.filter(u => u.status === 'pending').map(user => (
              <div key={user.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <button
                  onClick={async () => {
                    setLoading(true);
                    await approveUser(user.id);
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="bg-[#5D1F1F] text-white px-3 py-1 rounded text-sm hover:bg-[#4A1818] disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending approvals</p>
        )}
      </div>

      {/* Simple test of match results display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🎾 Recent Match Results (TEST)</h3>
        {matchResults && matchResults.length > 0 ? (
          <div className="space-y-2">
            {matchResults.slice(0, 5).map((result, index) => (
              <div key={index} className="p-2 border border-gray-200 rounded">
                <span className="font-bold">{result.pair1_score} - {result.pair2_score}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No match results found (matchResults: {matchResults?.length || 0})</p>
        )}
      </div>
    </div>
  );
};

export default AdminTab;