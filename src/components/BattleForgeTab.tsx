'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import NewArmyModal from './NewArmyModal';
import { Army, Unit } from '../types/army';
import ArmyDetailTab from './ArmyDetailTab';
import { calculateArmyPoints } from '../utils/unitUtils';

interface BattleForgeTabProps {
  armies: Army[];
  setArmies: Dispatch<SetStateAction<Army[]>>;
}

function ArmyCard({ army, onDelete, onView }: { army: Army; onDelete: () => void; onView: () => void }) {
  const allArmyUnits = [
    ...(army.characters || []),
    ...(army.battleline || []),
    ...(army.dedicatedTransports || []),
    ...(army.otherDatasheets || []),
    ...(army.alliedUnits || [])
  ];
  const currentPoints = calculateArmyPoints(allArmyUnits);
  const isOverPoints = currentPoints > army.points;

  return (
    <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-4 mb-4" style={{ boxShadow: '0 0 0 2px #000' }}>
      <div>
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-lg font-bold uppercase text-white pr-2">{army.armyName}</h2>
          <span className={`px-2 py-1 rounded text-sm font-bold ${isOverPoints ? 'bg-red-500 text-white' : 'bg-yellow-400 text-gray-900 dark:text-gray-900'}`}>
            {currentPoints} / {army.points} pts
          </span>
        </div>
        <div className="text-sm mb-1 text-gray-300">Faction: {army.faction}</div>
        <div className="text-sm mb-1 text-gray-300">Detachment: {army.detachment}</div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-600 text-sm rounded text-white hover:bg-red-700 transition-colors"
            title="Delete Army"
          >
            Delete Army
          </button>
          <button
            onClick={onView}
            className="px-3 py-1 bg-blue-600 text-sm rounded text-white hover:bg-blue-700 transition-colors"
            title="View Army"
          >
            View Army
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BattleForgeTab({ armies, setArmies }: BattleForgeTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingArmyIndex, setViewingArmyIndex] = useState<number | null>(null);
  const MAX_ARMIES = 10;

  const handleCreateArmy = (formData: {
    armyName: string;
    faction: string;
    detachment: string;
    points: number;
    characters: Unit[];
    battleline: Unit[];
    dedicatedTransports: Unit[];
    otherDatasheets: Unit[];
    alliedUnits: Unit[];
  }) => {
    if (armies.length < MAX_ARMIES) {
      setArmies([...armies, formData]);
      setIsModalOpen(false);
    }
  };

  if (viewingArmyIndex !== null && armies[viewingArmyIndex]) {
    return (
      <ArmyDetailTab 
        army={armies[viewingArmyIndex]} 
        onBack={() => setViewingArmyIndex(null)}
        onArmyUpdate={(updatedArmy) => {
          const updatedArmies = [...armies];
          updatedArmies[viewingArmyIndex] = updatedArmy;
          setArmies(updatedArmies);
        }}
      />
    );
  }

  return (
    <section className="mx-4 mt-4">
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={armies.length >= MAX_ARMIES}
        className={`w-full px-6 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg mb-4 ${
          armies.length >= MAX_ARMIES
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-black dark:text-black hover:bg-green-700'
        }`}
      >
        {armies.length >= MAX_ARMIES ? `Army Limit Reached (${MAX_ARMIES})` : 'Create Army'}
      </button>

      {isModalOpen && (
        <NewArmyModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateArmy}
        />
      )}

      <div>
        {[...armies].reverse().map((army, index) => {
          // Reverse index to match delete logic
          const realIndex = armies.length - 1 - index;
          return (
            <ArmyCard
              key={index}
              army={army}
              onDelete={() => setArmies(armies.filter((_, i) => i !== realIndex))}
              onView={() => setViewingArmyIndex(realIndex)}
            />
          );
        })}
      </div>
    </section>
  );
}
