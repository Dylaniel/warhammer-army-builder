'use client';

import { useState } from 'react';
import NewArmyModal from './NewArmyModal';
import { Army } from '../types/army';

interface BattleForgeTabProps {
  army: Army | null;
  setArmy: (army: Army | null) => void;
}

function ArmyCard({ army }: { army: Army }) {
  return (
    <div className="bg-gray-800 bg-opacity-80 rounded-lg p-4 mb-4 border border-gray-700">
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
          <button className="p-1 hover:bg-gray-700 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 10a2 2 0 100-4 2 2 0 000 4zm4 0a2 2 0 100-4 2 2 0 000 4zm4 0a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BattleForgeTab({ army, setArmy }: BattleForgeTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateArmy = (formData: { armyName: string; faction: string; detachment:string; points: number }) => {
    setArmy(formData);
    setIsModalOpen(false);
  };

  return (
    <section className="mx-4">
      {army && <ArmyCard army={army} />}
      {!army && (
        <div className="flex flex-col items-center justify-center h-48 bg-gray-800 bg-opacity-80 rounded-lg p-6 text-center">
          <p className="text-lg text-gray-400 mb-4">No army created yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors shadow-lg"
          >
            Create Your First Army
          </button>
        </div>
      )}

      <NewArmyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateArmy}
      />
    </section>
  );
}
