import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import EnhancedMatchResult from './EnhancedMatchResult';

const ReorderableMatchItem = ({
  fixture,
  existingScore,
  canEnterScore,
  openScoreModal,
  selectedSeason,
  currentUser,
  users,
  isSeasonCompleted,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isAdmin
}) => {
  const pair1Names = [fixture.player1?.name, fixture.player2?.name].filter(Boolean);
  const pair2Names = [fixture.player3?.name, fixture.player4?.name].filter(Boolean);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex">
        {/* Reorder Controls - Only show for admins */}
        {isAdmin && (canMoveUp || canMoveDown) && (
          <div className="flex flex-col bg-gray-50 border-r border-gray-200">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={`flex items-center justify-center w-10 h-6 transition-colors ${
                canMoveUp
                  ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 active:bg-gray-200'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={`flex items-center justify-center w-10 h-6 transition-colors ${
                canMoveDown
                  ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 active:bg-gray-200'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Match Content */}
        <div className="flex-1">
          {/* Enhanced Match Result Display */}
          {existingScore ? (
            <EnhancedMatchResult
              fixture={fixture}
              score={existingScore}
              selectedSeason={selectedSeason}
              currentUser={currentUser}
              users={users}
            />
          ) : (
            /* Placeholder for matches without scores */
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {pair1Names.join(' & ')} vs {pair2Names.join(' & ')}
                    {fixture.sitting_player && ` (${fixture.sitting_player.name} sitting)`}
                  </span>
                </div>
                <div className="text-sm text-gray-500">No score yet</div>
              </div>
            </div>
          )}

          {/* Integrated Challenge Button */}
          {canEnterScore && !isSeasonCompleted && (
            <div className="border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openScoreModal({
                    fixtureId: fixture.id,
                    pair1: pair1Names,
                    pair2: pair2Names
                  });
                }}
                className={`text-sm px-6 py-3 transition-colors min-h-[44px] w-full font-medium border-0 rounded-none rounded-br-xl ${
                  existingScore
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700'
                    : 'bg-[#5D1F1F] text-white hover:bg-[#4A1818] focus:bg-[#4A1818]'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {existingScore ? 'Challenge Score' : 'Enter Score'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReorderableMatchList = ({
  courtFixtures,
  getMatchScore,
  canUserEnterScores,
  openScoreModal,
  selectedSeason,
  currentUser,
  users,
  onReorderMatches,
  isSeasonCompleted
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const handleMoveUp = (courtIndex, fixtureIndex) => {
    const court = courtFixtures[courtIndex];
    const fixtures = [...court.fixtures];

    // Swap with the fixture above
    [fixtures[fixtureIndex], fixtures[fixtureIndex - 1]] =
    [fixtures[fixtureIndex - 1], fixtures[fixtureIndex]];

    // Update game numbers
    const updatedFixtures = fixtures.map((fixture, index) => ({
      ...fixture,
      game_number: index + 1
    }));

    onReorderMatches(courtIndex, updatedFixtures);
  };

  const handleMoveDown = (courtIndex, fixtureIndex) => {
    const court = courtFixtures[courtIndex];
    const fixtures = [...court.fixtures];

    // Swap with the fixture below
    [fixtures[fixtureIndex], fixtures[fixtureIndex + 1]] =
    [fixtures[fixtureIndex + 1], fixtures[fixtureIndex]];

    // Update game numbers
    const updatedFixtures = fixtures.map((fixture, index) => ({
      ...fixture,
      game_number: index + 1
    }));

    onReorderMatches(courtIndex, updatedFixtures);
  };

  return (
    <div className="space-y-4">
      {courtFixtures.map((court, courtIndex) => (
        <div key={court.court} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Court {court.court}</h4>
          <p className="text-sm text-gray-600 mb-3">
            Players: {[...new Set([
              ...court.fixtures.map(f => f.player1?.name),
              ...court.fixtures.map(f => f.player2?.name),
              ...court.fixtures.map(f => f.player3?.name),
              ...court.fixtures.map(f => f.player4?.name)
            ].filter(Boolean))].join(', ')}
          </p>

          <div className="space-y-2">
            {court.fixtures.map((fixture, fixtureIndex) => {
              const existingScore = getMatchScore(fixture.id);
              const canEnterScore = canUserEnterScores(fixture);
              const canMoveUp = fixtureIndex > 0;
              const canMoveDown = fixtureIndex < court.fixtures.length - 1;

              return (
                <ReorderableMatchItem
                  key={fixture.id}
                  fixture={fixture}
                  existingScore={existingScore}
                  canEnterScore={canEnterScore}
                  openScoreModal={openScoreModal}
                  selectedSeason={selectedSeason}
                  currentUser={currentUser}
                  users={users}
                  isSeasonCompleted={isSeasonCompleted}
                  isAdmin={isAdmin}
                  onMoveUp={() => handleMoveUp(courtIndex, fixtureIndex)}
                  onMoveDown={() => handleMoveDown(courtIndex, fixtureIndex)}
                  canMoveUp={canMoveUp}
                  canMoveDown={canMoveDown}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReorderableMatchList;