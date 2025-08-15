'use client';

import { useState } from 'react';
import NewArmyModal from './NewArmyModal';
import { Army } from '../types/army';
import ArmyDetailTab from './ArmyDetailTab';

interface BattleForgeTabProps {
  armies: Army[];
  setArmies: (armies: Army[]) => void;
}

function ArmyCard({ army, onDelete, onView }: { army: Army; onDelete: () => void; onView: () => void }) {
  return (
    <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-4 mb-4" style={{ boxShadow: '0 0 0 2px #000' }}>
      <div>
        <h2 className="text-lg font-bold uppercase mb-1 dark:text-white text-gray-900">{army.armyName}</h2>
        <div className="text-sm mb-1 dark:text-gray-300 text-gray-700">Faction: {army.faction}</div>
        <div className="text-sm mb-1 dark:text-gray-300 text-gray-700">Detachment: {army.detachment}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-900 dark:text-gray-900 px-2 py-1 rounded text-sm font-bold bg-yellow-400">
            Points: {army.points}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onView}
              className="px-3 py-1 bg-blue-600 text-sm rounded text-white hover:bg-blue-700 transition-colors"
              title="View Army"
            >
              View Army
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1 bg-red-600 text-sm rounded dark:text-white text-white hover:bg-red-700 transition-colors ml-2"
              title="Delete Army"
            >
              Delete Army
            </button>
          </div>
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
    characters: any[];
    battleline: any[];
    dedicatedTransports: any[];
    otherDatasheets: any[];
    alliedUnits: any[];
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
    <section className="mx-4">
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
