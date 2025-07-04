'use client';

import { useState } from 'react';
import NewArmyModal from './NewArmyModal';
import { Army } from '../types/army';

interface BattleForgeTabProps {
  armies: Army[];
  setArmies: (armies: Army[]) => void;
}

function ArmyCard({ army, onDelete }: { army: Army; onDelete: () => void }) {
  return (
    <div className="bg-gray-800 bg-opacity-80 rounded-lg p-4 mb-4 border-2 border-black">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-bold uppercase text-white">{army.armyName}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
            <span>{army.faction}</span>
            <span>•</span>
            <span>{army.detachment}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-yellow-500 text-gray-900 px-2 py-1 rounded text-sm font-bold">
            {army.points} pts
          </span>
          <button 
            onClick={onDelete}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            title="Delete Army"
          >
            Delete Army
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BattleForgeTab({ armies, setArmies }: BattleForgeTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const MAX_ARMIES = 5;

  const handleCreateArmy = (formData: { armyName: string; faction: string; detachment:string; points: number }) => {
    if (armies.length < MAX_ARMIES) {
      setArmies([...armies, formData]);
      setIsModalOpen(false);
    }
  };

  return (
    <section className="mx-4">
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={armies.length >= MAX_ARMIES}
        className={`w-full px-6 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg mb-4 ${
          armies.length >= MAX_ARMIES
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
        }`}
      >
        {armies.length >= MAX_ARMIES ? 'Army Limit Reached (5)' : 'Create Army'}
      </button>

      {armies.map((army, index) => (
        <ArmyCard key={index} army={army} onDelete={() => setArmies(armies.filter((a) => a.armyName !== army.armyName))} />
      ))}

      <NewArmyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateArmy}
      />
    </section>
  );
}
