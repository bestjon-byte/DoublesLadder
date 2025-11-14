// src/components/Modals/EnhancedScoreModal.js - FIXED
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Flag, Eye } from 'lucide-react';
import { useAppToast } from '../../contexts/ToastContext';
import { haptics } from '../../utils/haptics';

const EnhancedScoreModal = ({ 
  showModal, 
  setShowModal, 
  selectedMatch, 
  setSelectedMatch, 
  submitScore,
  currentUser,
  getMatchScore,
  onChallengeScore 
}) => {
  const toast = useAppToast();
  const [pair1Score, setPair1Score] = useState('');
  const [pair2Score, setPair2Score] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingScore, setExistingScore] = useState(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [challengeReason, setChallengeReason] = useState('');

  useEffect(() => {
    if (selectedMatch?.fixtureId) {
      const score = getMatchScore(selectedMatch.fixtureId);
      setExistingScore(score);
      // Small delay to prevent flash
      setTimeout(() => setDataLoaded(true), 100);
    } else {
      setDataLoaded(false);
      setExistingScore(null);
    }
  }, [selectedMatch, getMatchScore]);

  // Debug info available in development mode via UI debug section

  // Player match validation logic handled in canUserEnterScore calculation

  const handleSubmit = async () => {
    if (!pair1Score || !pair2Score) {
      haptics.warning(); // Haptic feedback for validation error
      toast.warning('Please enter scores for both pairs');
      return;
    }

    haptics.impact(); // Strong haptic feedback for score submission
    setLoading(true);
    
    try {
      // Check one more time if a score was submitted while modal was open
      const latestScore = getMatchScore(selectedMatch.fixtureId);
      
      if (latestScore && !existingScore) {
        // Someone else submitted while we had the modal open
        toast.warning(`Someone already submitted a different score: ${latestScore.pair1_score}-${latestScore.pair2_score}. Closing modal to show current score.`, 6000);

        // Close modal and let React re-render with fresh data
        setTimeout(() => closeModal(), 2000);
        return;
      }
      
      const result = await submitScore(pair1Score, pair2Score);
      
      if (result?.conflict) {
        // Handle the conflict case
        toast.warning(`Score conflict! Winning score: ${result.winningScore.pair1_score}-${result.winningScore.pair2_score}. You can challenge this score if needed.`, 6000);
        setTimeout(() => closeModal(), 2000);
      } else if (result?.success) {
        // Success case
        haptics.success(); // Success haptic feedback
        toast.success('Score submitted successfully!');
        closeModal();
      }
    } catch (error) {
      haptics.error(); // Error haptic feedback
      toast.error(`Error submitting score: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async () => {
    if (!challengeReason.trim()) {
      toast.warning('Please provide a reason for challenging this score');
      return;
    }

    setLoading(true);
    
    try {
      await onChallengeScore({
        fixtureId: selectedMatch.fixtureId,
        originalResultId: existingScore.id,
        challengedPair1Score: parseInt(pair1Score),
        challengedPair2Score: parseInt(pair2Score),
        reason: challengeReason
      });
      
      haptics.success(); // Success haptic for challenge
      toast.success('Challenge submitted! An admin will review your dispute.');
      closeModal();
    } catch (error) {
      haptics.error(); // Error haptic for challenge
      toast.error(`Error submitting challenge: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMatch(null);
    setPair1Score('');
    setPair2Score('');
    setChallengeReason('');
    setShowChallenge(false);
    setExistingScore(null);
    setDataLoaded(false);
  };

  if (!showModal || !selectedMatch) return null;

  const canUserEnterScore = currentUser?.role === 'admin' || 
    [selectedMatch.pair1, selectedMatch.pair2].flat().includes(currentUser?.name);

  // User permission check complete

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            {existingScore ? (
              <>
                <Eye className="w-5 h-5 mr-2 text-blue-500" />
                View/Challenge Score
              </>
            ) : (
              'Enter Score'
            )}
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {selectedMatch.pair1.join(' & ')} vs {selectedMatch.pair2.join(' & ')}
              </p>
            </div>

            {existingScore ? (
              // Show existing score
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Current Score:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{selectedMatch.pair1.join(' & ')}</p>
                    <p className="text-2xl font-bold text-green-700">{existingScore.pair1_score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{selectedMatch.pair2.join(' & ')}</p>
                    <p className="text-2xl font-bold text-green-700">{existingScore.pair2_score}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Submitted: {existingScore.created_at ? new Date(existingScore.created_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
            ) : null}

            {/* Score entry/challenge form */}
            {(!existingScore || showChallenge) && canUserEnterScore && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedMatch.pair1.join(' & ')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={pair1Score}
                      onChange={(e) => setPair1Score(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Games won"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedMatch.pair2.join(' & ')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={pair2Score}
                      onChange={(e) => setPair2Score(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Games won"
                      disabled={loading}
                    />
                  </div>
                </div>

                {showChallenge && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Challenge
                    </label>
                    <textarea
                      value={challengeReason}
                      onChange={(e) => setChallengeReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      rows="3"
                      placeholder="Explain why you believe the recorded score is incorrect..."
                      disabled={loading}
                    />
                  </div>
                )}
              </>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              {!existingScore && canUserEnterScore ? (
                // New score submission
                <button
                  onClick={handleSubmit}
                  disabled={loading || !pair1Score || !pair2Score}
                  className="flex-1 bg-[#5D1F1F] text-white py-2 px-4 rounded-md hover:bg-[#4A1818] disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Score'}
                </button>
              ) : dataLoaded && existingScore && canUserEnterScore && !showChallenge ? (
                // Challenge existing score
                <button
                  onClick={() => setShowChallenge(true)}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 flex items-center justify-center"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Challenge Score
                </button>
              ) : dataLoaded && showChallenge ? (
                // Submit challenge
                <button
                  onClick={handleChallenge}
                  disabled={loading || !pair1Score || !pair2Score || !challengeReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting Challenge...' : 'Submit Challenge'}
                </button>
              ) : null}
              
              <button
                onClick={closeModal}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                {showChallenge ? 'Cancel Challenge' : 'Close'}
              </button>
            </div>

            {/* User permission message */}
            {!canUserEnterScore && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 text-sm">
                    Only players in this match can enter scores or challenge results.
                  </p>
                </div>
              </div>
            )}

            {/* DEBUG INFO */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
                <p><strong>Debug:</strong></p>
                <p>User: {currentUser?.name}</p>
                <p>Can enter: {canUserEnterScore ? 'Yes' : 'No'}</p>
                <p>Existing score: {existingScore ? 'Yes' : 'No'}</p>
                <p>Show challenge: {showChallenge ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedScoreModal;