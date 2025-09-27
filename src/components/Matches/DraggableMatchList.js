import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import EnhancedMatchResult from './EnhancedMatchResult';

const SortableMatchItem = ({
  fixture,
  existingScore,
  canEnterScore,
  openScoreModal,
  selectedSeason,
  currentUser,
  users,
  isSeasonCompleted
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fixture.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  const pair1Names = [fixture.player1?.name, fixture.player2?.name].filter(Boolean);
  const pair2Names = [fixture.player3?.name, fixture.player4?.name].filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${
        isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-12 bg-gray-50 border-r border-gray-200 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

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

const DraggableMatchList = ({
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Find which court this belongs to
      const activeCourtIndex = courtFixtures.findIndex(court =>
        court.fixtures.some(f => f.id === active.id)
      );
      const overCourtIndex = courtFixtures.findIndex(court =>
        court.fixtures.some(f => f.id === over.id)
      );

      if (activeCourtIndex === overCourtIndex && activeCourtIndex !== -1) {
        // Reordering within the same court
        const court = courtFixtures[activeCourtIndex];
        const oldIndex = court.fixtures.findIndex(f => f.id === active.id);
        const newIndex = court.fixtures.findIndex(f => f.id === over.id);

        const newFixtures = arrayMove(court.fixtures, oldIndex, newIndex);

        // Update the fixtures with new game_number
        const updatedFixtures = newFixtures.map((fixture, index) => ({
          ...fixture,
          game_number: index + 1
        }));

        onReorderMatches(activeCourtIndex, updatedFixtures);
      }
    }
  };

  return (
    <div className="space-y-4">
      {courtFixtures.map((court) => (
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={court.fixtures.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {court.fixtures.map((fixture) => {
                  const existingScore = getMatchScore(fixture.id);
                  const canEnterScore = canUserEnterScores(fixture);

                  return (
                    <SortableMatchItem
                      key={fixture.id}
                      fixture={fixture}
                      existingScore={existingScore}
                      canEnterScore={canEnterScore}
                      openScoreModal={openScoreModal}
                      selectedSeason={selectedSeason}
                      currentUser={currentUser}
                      users={users}
                      isSeasonCompleted={isSeasonCompleted}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ))}
    </div>
  );
};

export default DraggableMatchList;