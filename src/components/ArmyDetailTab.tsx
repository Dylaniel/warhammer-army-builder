import React, { useState } from 'react';
import { Army, Unit } from '../types/army';
import { getAllUnits, createArmyUnit } from '../utils/unitUtils';

interface ArmyDetailTabProps {
  army: Army;
  onBack: () => void;
  onArmyUpdate: (updatedArmy: Army) => void;
}

export default function ArmyDetailTab({ army, onBack, onArmyUpdate }: ArmyDetailTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const allUnits = getAllUnits();

  // Map category names to unit roles for filtering
  const getCategoryRole = (category: string): Unit['role'] | null => {
    switch (category) {
      case 'Characters':
        return 'HQ';
      case 'Battleline':
        return 'TROOPS';
      case 'Dedicated Transports':
        return 'DEDICATED_TRANSPORT';
      case 'Other Datasheets':
        return 'ELITES';
      case 'Allied Units':
        return null;
      default:
        return null;
    }
  };

  // Get units for each category
  const getUnitsForCategory = (category: string): Unit[] => {
    switch (category) {
      case 'Characters':
        return army.characters || [];
      case 'Battleline':
        return army.battleline || [];
      case 'Dedicated Transports':
        return army.dedicatedTransports || [];
      case 'Other Datasheets':
        return army.otherDatasheets || [];
      case 'Allied Units':
        return army.alliedUnits || [];
      default:
        return [];
    }
  };

  // Get available units for selection
  const getAvailableUnits = (category: string): Unit[] => {
    const categoryRole = getCategoryRole(category);
    return categoryRole 
      ? allUnits.filter((unit: Unit) => unit.role === categoryRole)
      : allUnits;
  };

  //adds unit selected to the relevant category
  const handleAddUnit = (unit: Unit, category: string): void => {
    const armyUnit = createArmyUnit(unit);
    const updatedArmy = { ...army };
    
    switch (category) {
      case 'Characters':
        updatedArmy.characters = [...(army.characters || []), armyUnit];
        break;
      case 'Battleline':
        updatedArmy.battleline = [...(army.battleline || []), armyUnit];
        break;
      case 'Dedicated Transports':
        updatedArmy.dedicatedTransports = [...(army.dedicatedTransports || []), armyUnit];
        break;
      case 'Other Datasheets':
        updatedArmy.otherDatasheets = [...(army.otherDatasheets || []), armyUnit];
        break;
      case 'Allied Units':
        updatedArmy.alliedUnits = [...(army.alliedUnits || []), armyUnit];
        break;
    }
    
    onArmyUpdate(updatedArmy);
  };

  //controls which category is expanded to add available units
  const handleToggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const categories = [
    'Characters',
    'Battleline',
    'Dedicated Transports',
    'Other Datasheets',
    'Allied Units',
  ];

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Back to Battle Forge
      </button>
      
      <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-4 mb-4" style={{ boxShadow: '0 0 0 2px #000' }}>
        <h2 className="text-lg font-bold uppercase mb-1 text-white">{army.armyName}</h2>
        <div className="text-sm mb-1 text-gray-300">Faction: {army.faction}</div>
        <div className="text-sm mb-1 text-gray-300">Detachment: {army.detachment}</div>
        <div className="text-sm mb-1 text-gray-300">Points: {army.points}</div>
      </div>

      {/* Unit categories */}
      <div className="space-y-3">
        {categories.map((category) => {
          const categoryUnits = getUnitsForCategory(category);
          const availableUnits = getAvailableUnits(category);
          const isExpanded = expandedCategory === category;
          
          return (
            <div key={category} className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="w-full flex items-center justify-between py-3 px-4 text-lg font-bold uppercase text-gray-800 dark:text-gray-100 text-left">
                <span>{category}</span>
                <button
                  onClick={() => handleToggleCategory(category)}
                  className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded ml-2"
                  title={`Add to ${category}`}
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {/* Display units in this category */}
              {categoryUnits.length > 0 && (
                <div className="px-4 pb-3 space-y-2">
                  {categoryUnits.map((unit) => (
                    <div key={unit.id} className="flex justify-between items-center py-2 px-3 bg-gray-100 dark:bg-gray-600 rounded">
                      <span className="font-medium text-white">{unit.name}</span>
                      <span className="text-sm text-gray-300">
                        {unit.totalPoints || unit.basePoints} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Show available units when expanded */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2 border-t border-gray-300 dark:border-gray-600">
                  <div className="pt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Units:
                  </div>
                  {availableUnits.map((unit) => (
                                         <div 
                       key={unit.id} 
                       className="flex justify-between items-center py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                       onClick={() => handleAddUnit(unit, category)}
                     >
                      <span className="font-medium dark:text-white text-gray-900">{unit.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {unit.basePoints} pts
                      </span>
                    </div>
                  ))}
                  {availableUnits.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                      No units available for this category.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 