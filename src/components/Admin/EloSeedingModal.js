import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useEloCalculations } from '../../hooks/useEloCalculations';
import { getEloRankLabel, getEloRankColor } from '../../utils/eloCalculator';

const EloSeedingModal = ({ isOpen, onClose, season, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [editingPlayers, setEditingPlayers] = useState({});
  const [seedingMode, setSeedingMode] = useState('individual'); // 'individual', 'bulk', 'previous'
  const [csvData, setCsvData] = useState('');
  const [previousSeasons, setPreviousSeasons] = useState([]);
  const [selectedPreviousSeason, setSelectedPreviousSeason] = useState('');
  
  const { 
    bulkUpdatePlayerElos, 
    copyElosFromPreviousSeason, 
    triggerEloRecalculation,
    updateSeasonEloSettings
  } = useEloCalculations();

  useEffect(() => {
    if (isOpen && season) {
      fetchSeasonPlayers();
      fetchPreviousSeasons();
    }
  }, [isOpen, season]);

  const fetchSeasonPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('season_players')
        .select(`
          id,
          player_id,
          elo_rating,
          matches_played,
          matches_won,
          player:profiles(name)
        `)
        .eq('season_id', season.id)
        .order('elo_rating', { ascending: false, nullsLast: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching season players:', error);
    }
  };

  const fetchPreviousSeasons = async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name, start_date, elo_enabled')
        .neq('id', season.id)
        .eq('elo_enabled', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPreviousSeasons(data || []);
    } catch (error) {
      console.error('Error fetching previous seasons:', error);
    }
  };

  const handlePlayerEloChange = (playerId, newRating) => {
    const rating = Math.max(500, Math.min(3000, parseInt(newRating) || 1200));
    setEditingPlayers(prev => ({
      ...prev,
      [playerId]: rating
    }));
  };

  const handleIndividualSave = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(editingPlayers).map(([playerId, eloRating]) => ({
        playerId,
        eloRating
      }));

      if (updates.length === 0) {
        alert('No changes to save');
        return;
      }

      const result = await bulkUpdatePlayerElos(season.id, updates);
      
      if (result.success) {
        await fetchSeasonPlayers();
        setEditingPlayers({});
        onSuccess?.('ELO ratings updated successfully');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating ELO ratings:', error);
      alert(`Error updating ELO ratings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCsvSave = async () => {
    setLoading(true);
    try {
      const lines = csvData.trim().split('\n');
      const updates = [];
      
      for (const line of lines) {
        const [playerName, eloRating] = line.split(',').map(s => s.trim());
        const player = players.find(p => 
          p.player.name.toLowerCase().includes(playerName.toLowerCase()) ||
          playerName.toLowerCase().includes(p.player.name.toLowerCase())
        );
        
        if (player && eloRating) {
          const rating = Math.max(500, Math.min(3000, parseInt(eloRating) || 1200));
          updates.push({
            playerId: player.player_id,
            eloRating: rating
          });
        }
      }

      if (updates.length === 0) {
        alert('No valid player/rating pairs found in CSV data');
        return;
      }

      const result = await bulkUpdatePlayerElos(season.id, updates);
      
      if (result.success) {
        await fetchSeasonPlayers();
        setCsvData('');
        onSuccess?.(`Updated ELO ratings for ${updates.length} players`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error bulk updating ELO ratings:', error);
      alert(`Error updating ELO ratings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromPrevious = async () => {
    if (!selectedPreviousSeason) {
      alert('Please select a previous season');
      return;
    }

    setLoading(true);
    try {
      const result = await copyElosFromPreviousSeason(season.id, selectedPreviousSeason);
      
      if (result.success) {
        await fetchSeasonPlayers();
        onSuccess?.(`Copied ELO ratings for ${result.updatedCount} players`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error copying ELO ratings:', error);
      alert(`Error copying ELO ratings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllRatings = async () => {
    if (!window.confirm('Are you sure you want to reset all players to the default rating? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const updates = players.map(player => ({
        playerId: player.player_id,
        eloRating: season.elo_initial_rating || 1200
      }));

      const result = await bulkUpdatePlayerElos(season.id, updates);
      
      if (result.success) {
        await fetchSeasonPlayers();
        onSuccess?.('All ELO ratings reset to default');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error resetting ELO ratings:', error);
      alert(`Error resetting ELO ratings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateFromMatches = async () => {
    if (!window.confirm('This will recalculate all ELO ratings based on match results. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await triggerEloRecalculation(season.id);
      
      if (result.success) {
        await fetchSeasonPlayers();
        onSuccess?.(`Recalculated ELO ratings from ${result.processedMatches} matches`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error recalculating ELO ratings:', error);
      alert(`Error recalculating ELO ratings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">ELO Rating Management - {season.name}</h2>
          <p className="text-gray-600 mt-1">Seed and manage ELO ratings for this season</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seeding Mode</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setSeedingMode('individual')}
                className={`px-4 py-2 rounded ${
                  seedingMode === 'individual' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setSeedingMode('bulk')}
                className={`px-4 py-2 rounded ${
                  seedingMode === 'bulk' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Bulk CSV
              </button>
              <button
                onClick={() => setSeedingMode('previous')}
                className={`px-4 py-2 rounded ${
                  seedingMode === 'previous' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Copy Previous
              </button>
            </div>
          </div>

          {/* Individual Mode */}
          {seedingMode === 'individual' && (
            <div>
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={handleResetAllRatings}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reset All to Default
                </button>
                <button
                  onClick={handleRecalculateFromMatches}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Recalculate from Matches
                </button>
              </div>

              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {players.map(player => {
                  const currentRating = editingPlayers[player.player_id] ?? player.elo_rating ?? 1200;
                  return (
                    <div key={player.id} className="flex items-center space-x-4 p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{player.player.name}</div>
                        <div className="text-sm text-gray-500">
                          {player.matches_played} matches played, {player.matches_won} won
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getEloRankColor(currentRating)}`}>
                          {getEloRankLabel(currentRating)}
                        </span>
                        <input
                          type="number"
                          min="500"
                          max="3000"
                          value={currentRating}
                          onChange={(e) => handlePlayerEloChange(player.player_id, e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-center"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(editingPlayers).length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleIndividualSave}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : `Save Changes (${Object.keys(editingPlayers).length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bulk CSV Mode */}
          {seedingMode === 'bulk' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Data (Player Name, ELO Rating)
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="John Smith, 1350&#10;Jane Doe, 1280&#10;..."
                  className="w-full h-32 px-3 py-2 border rounded"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: Player Name, ELO Rating (one per line)
                </p>
              </div>

              <button
                onClick={handleBulkCsvSave}
                disabled={loading || !csvData.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Import CSV'}
              </button>
            </div>
          )}

          {/* Copy from Previous Season Mode */}
          {seedingMode === 'previous' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Season
                </label>
                <select
                  value={selectedPreviousSeason}
                  onChange={(e) => setSelectedPreviousSeason(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select a previous season...</option>
                  {previousSeasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name} (Started: {new Date(season.start_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCopyFromPrevious}
                disabled={loading || !selectedPreviousSeason}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Copying...' : 'Copy ELO Ratings'}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EloSeedingModal;