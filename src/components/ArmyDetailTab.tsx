import React from 'react';
import { Army } from '../types/army';

interface ArmyDetailTabProps {
  army: Army;
  onBack: () => void;
}

export default function ArmyDetailTab({ army, onBack }: ArmyDetailTabProps) {
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Back to Battle Forge
      </button>
      <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-4 mb-4" style={{ boxShadow: '0 0 0 2px #000' }}>
        <h2 className="text-lg font-bold uppercase mb-1 dark:text-white text-gray-900">{army.armyName}</h2>
        <div className="text-sm mb-1 dark:text-gray-300 text-gray-700">Faction: {army.faction}</div>
        <div className="text-sm mb-1 dark:text-gray-300 text-gray-700">Detachment: {army.detachment}</div>
        <div className="text-sm mb-1 dark:text-gray-300 text-gray-700">Points: {army.points}</div>
      </div>
      {/* Unit category labels */}
      <div className="space-y-3">
        {[
          'Characters',
          'Battleline',
          'Dedicated Transports',
          'Other Datasheets',
          'Allied Units',
        ].map((label) => (
          <div key={label} className="w-full flex items-center justify-between bg-gray-200 dark:bg-gray-700 py-3 px-4 text-lg font-bold uppercase text-gray-800 dark:text-gray-100 text-left">
            <span>{label}</span>
            <button
              className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded ml-2"
              title={`Add to ${label}`}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 