'use client';

import { useState } from 'react';
import NewArmyModal from './NewArmyModal';
import FloatingActionButton from './FloatingActionButton';

interface Army {
  armyName: string;
  faction: string;
  detachment: string;
  points: number;
}

function ArmyCard({ army }: { army: Army }) {
  return (
    <div className="bg-gray-800 bg-opacity-80 rounded-lg overflow-hidden flex mb-4">
      <div className="p-4 flex-1">
        <h2 className="text-2xl font-bold uppercase">{army.armyName}</h2>
        <p className="text-gray-400 mt-1">{army.faction}</p>
        <p className="text-gray-400 mt-1">{army.detachment}</p>
        <span className="inline-block bg-gray-100 text-gray-900 px-3 py-1 rounded-full font-semibold mt-3">
          {army.points} Points
        </span>
      </div>
      <div
        className="w-32 h-32 bg-cover bg-center"
        style={{ backgroundImage: "url('https://via.placeholder.com/128')" }}
      ></div>
      <button className="p-3 hover:bg-gray-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6 10a2 2 0 100-4 2 2 0 000 4zm4 0a2 2 0 100-4 2 2 0 000 4zm4 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </div>
  );
}

export default function BattleForgeTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [army, setArmy] = useState<Army | null>(null);

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

      {!army && <FloatingActionButton onClick={() => setIsModalOpen(true)} />}
    </section>
  );
}
