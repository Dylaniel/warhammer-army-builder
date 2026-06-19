import React, { useState } from 'react';
import { Army, Unit } from '../types/army';
import { getAllUnits, createArmyUnit, calculateArmyPoints } from '../utils/unitUtils';
import EditArmyModal from './EditArmyModal';

interface ArmyDetailTabProps {
  army: Army;
  onBack: () => void;
  onArmyUpdate: (updatedArmy: Army) => void;
}

export default function ArmyDetailTab({ army, onBack, onArmyUpdate }: ArmyDetailTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const allUnits = getAllUnits();

  const allArmyUnits = [
    ...(army.characters || []),
    ...(army.battleline || []),
    ...(army.dedicatedTransports || []),
    ...(army.otherDatasheets || []),
    ...(army.alliedUnits || [])
  ];
  const currentPoints = calculateArmyPoints(allArmyUnits);
  const isOverPoints = currentPoints > army.points;

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

  const handleDeleteUnit = (unitId: string, category: string) => {
    const updatedArmy = { ...army };
    switch (category) {
      case 'Characters': updatedArmy.characters = (army.characters || []).filter(u => u.id !== unitId); break;
      case 'Battleline': updatedArmy.battleline = (army.battleline || []).filter(u => u.id !== unitId); break;
      case 'Dedicated Transports': updatedArmy.dedicatedTransports = (army.dedicatedTransports || []).filter(u => u.id !== unitId); break;
      case 'Other Datasheets': updatedArmy.otherDatasheets = (army.otherDatasheets || []).filter(u => u.id !== unitId); break;
      case 'Allied Units': updatedArmy.alliedUnits = (army.alliedUnits || []).filter(u => u.id !== unitId); break;
    }
    onArmyUpdate(updatedArmy);
    setOpenMenuId(null);
  };

  const handleDuplicateUnit = (unit: Unit, category: string) => {
    const updatedArmy = { ...army };
    const duplicatedUnit = { ...unit, id: `${unit.id.split('-')[0]}-${Date.now()}` };
    switch (category) {
      case 'Characters': updatedArmy.characters = [...(army.characters || []), duplicatedUnit]; break;
      case 'Battleline': updatedArmy.battleline = [...(army.battleline || []), duplicatedUnit]; break;
      case 'Dedicated Transports': updatedArmy.dedicatedTransports = [...(army.dedicatedTransports || []), duplicatedUnit]; break;
      case 'Other Datasheets': updatedArmy.otherDatasheets = [...(army.otherDatasheets || []), duplicatedUnit]; break;
      case 'Allied Units': updatedArmy.alliedUnits = [...(army.alliedUnits || []), duplicatedUnit]; break;
    }
    onArmyUpdate(updatedArmy);
    setOpenMenuId(null);
  };

  //controls which category is expanded to add available units
  const handleToggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleEditArmy = (updatedData) => {
    onArmyUpdate({ ...army, ...updatedData });
    setIsEditModalOpen(false);
  };

  const categories = [
    'Characters',
    'Battleline',
    'Dedicated Transports',
    'Other Datasheets',
    'Allied Units',
  ];

  return (
    <div className="relative pb-4">
      {/* Static Background at the very top */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-700 z-0"></div>

      {/* Sticky header container for buttons */}
      <div className="sticky top-0 z-40 px-4 py-2 flex justify-between items-center pointer-events-none mb-4">
        <button
          onClick={onBack}
          className="pointer-events-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow-md border border-gray-700"
        >
          Back to Battle Forge
        </button>
        <span className={`pointer-events-auto px-3 py-2 rounded text-sm font-bold shadow-md border border-gray-700 ${isOverPoints ? 'bg-red-500 text-white' : 'bg-yellow-400 text-gray-900 dark:text-gray-900'}`}>
          {currentPoints} / {army.points} pts
        </span>
      </div>
      
      <div className="px-4 relative z-10">
        <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-4 mb-4" style={{ boxShadow: '0 0 0 2px #000' }}>
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-lg font-bold uppercase text-white">{army.armyName}</h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-2 py-1 bg-blue-600 text-xs rounded text-white hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="text-sm mb-1 text-gray-300">Faction: {army.faction}</div>
          <div className="text-sm mb-1 text-gray-300">Detachment: {army.detachment}</div>
        </div>

        {/* Unit categories */}
        <div className="space-y-3">
        {categories.map((category) => {
          const categoryUnits = getUnitsForCategory(category);
          const availableUnits = getAvailableUnits(category);
          const isExpanded = expandedCategory === category;
          
          return (
            <div key={category} className="bg-gray-200 dark:bg-gray-700 rounded-lg">
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
                    <div key={unit.id} className="relative flex justify-between items-center py-2 px-3 bg-gray-100 dark:bg-gray-600 rounded">
                      <span className="font-medium text-white">{unit.name}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-300 mr-2">
                          {unit.totalPoints || unit.basePoints} pts
                        </span>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === unit.id ? null : unit.id)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {openMenuId === unit.id && (
                          <>
                            {/* Invisible overlay to catch clicks outside the dropdown */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-10 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[50] border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <div className="py-1 text-sm flex flex-col relative z-50">
                                <button
                                  onClick={() => handleDuplicateUnit(unit, category)}
                                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Duplicate
                                </button>
                                <button
                                  onClick={() => handleDeleteUnit(unit.id, category)}
                                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
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
      <EditArmyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditArmy}
        army={army}
      />
    </div>
  );
} 