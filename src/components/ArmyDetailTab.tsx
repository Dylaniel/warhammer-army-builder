import React, { useState } from 'react';
import { Army, Unit } from '../types/army';
import {
  createArmyUnit,
  calculateArmyPoints,
  describeUnitComposition,
  getDisplayStats,
  getSafeUnitPoints,
  getUnitPickerPrice,
  generateArmyUnitId,
  getWarlordStatus,
  WarlordStatus,
} from '../utils/unitUtils';
import { useFactionUnits } from '../hooks/useFactionUnits';
import EditArmyModal from './EditArmyModal';
import UnitDetailTab from './UnitDetailTab';
import BattleModeTab from './BattleModeTab';

interface ArmyDetailTabProps {
  army: Army;
  onBack: () => void;
  // Functional updater rather than a plain Army: the caller (OpenForgeTab)
  // resolves this against the latest committed armies state, not a
  // snapshot captured at render time. This lets N rapid interactions
  // (duplicate/add/delete/etc.) all apply instead of racing against a
  // stale `army` prop and silently dropping updates.
  onArmyUpdate: (update: (prevArmy: Army) => Army) => void;
}

export default function ArmyDetailTab({ army, onBack, onArmyUpdate }: ArmyDetailTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBattleModeOpen, setIsBattleModeOpen] = useState(false);
  // Store only the id of the open unit, not the Unit object itself. The
  // displayed unit is derived below from the latest `army` prop on every
  // render, so it can never go stale after an update.
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const { units: allUnits, loading } = useFactionUnits(army.faction);

  const allArmyUnits = [
    ...(army.characters || []),
    ...(army.battleline || []),
    ...(army.dedicatedTransports || []),
    ...(army.otherDatasheets || []),
    ...(army.alliedUnits || []),
  ];
  const currentPoints = calculateArmyPoints(allArmyUnits);
  const isOverPoints = currentPoints > army.points;
  const warlordStatus = getWarlordStatus(army);
  const selectedUnit = selectedUnitId
    ? (allArmyUnits.find((u) => u.id === selectedUnitId) ?? null)
    : null;

  // Map category names to unit roles for filtering
  const getCategoryRoles = (category: string): Unit['role'][] | null => {
    switch (category) {
      case 'Characters':
        return ['HQ'];
      case 'Battleline':
        return ['TROOPS'];
      case 'Dedicated Transports':
        return ['DEDICATED_TRANSPORT'];
      case 'Other Datasheets':
        return ['ELITES', 'FAST_ATTACK', 'HEAVY_SUPPORT', 'FLYER'];
      case 'Allied Units':
        return []; // We will implement allied unit logic later. For now, it should be empty.
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
    const categoryRoles = getCategoryRoles(category);
    let filteredUnits = categoryRoles
      ? allUnits.filter((unit: Unit) => categoryRoles.includes(unit.role))
      : allUnits;
    filteredUnits = filteredUnits.filter((unit: Unit) => unit.faction === army.faction);
    return filteredUnits;
  };

  //adds unit selected to the relevant category
  const handleAddUnit = (unit: Unit, category: string): void => {
    const armyUnit = createArmyUnit(unit);

    onArmyUpdate((prevArmy) => {
      const updatedArmy = { ...prevArmy };
      switch (category) {
        case 'Characters':
          updatedArmy.characters = [...(prevArmy.characters || []), armyUnit];
          break;
        case 'Battleline':
          updatedArmy.battleline = [...(prevArmy.battleline || []), armyUnit];
          break;
        case 'Dedicated Transports':
          updatedArmy.dedicatedTransports = [...(prevArmy.dedicatedTransports || []), armyUnit];
          break;
        case 'Other Datasheets':
          updatedArmy.otherDatasheets = [...(prevArmy.otherDatasheets || []), armyUnit];
          break;
        case 'Allied Units':
          updatedArmy.alliedUnits = [...(prevArmy.alliedUnits || []), armyUnit];
          break;
      }
      return updatedArmy;
    });
  };

  const handleDeleteUnit = (unitId: string, category: string) => {
    onArmyUpdate((prevArmy) => {
      const updatedArmy = { ...prevArmy };
      switch (category) {
        case 'Characters':
          updatedArmy.characters = (prevArmy.characters || []).filter((u) => u.id !== unitId);
          break;
        case 'Battleline':
          updatedArmy.battleline = (prevArmy.battleline || []).filter((u) => u.id !== unitId);
          break;
        case 'Dedicated Transports':
          updatedArmy.dedicatedTransports = (prevArmy.dedicatedTransports || []).filter(
            (u) => u.id !== unitId
          );
          break;
        case 'Other Datasheets':
          updatedArmy.otherDatasheets = (prevArmy.otherDatasheets || []).filter(
            (u) => u.id !== unitId
          );
          break;
        case 'Allied Units':
          updatedArmy.alliedUnits = (prevArmy.alliedUnits || []).filter((u) => u.id !== unitId);
          break;
      }
      return updatedArmy;
    });
    setOpenMenuId(null);
  };

  const handleDuplicateUnit = (unit: Unit, category: string) => {
    // Generated once per click (not inside the updater, which may be
    // re-invoked by React) so each of N rapid clicks yields a distinct,
    // full-base-id-preserving id — see generateArmyUnitId in unitUtils.
    const duplicatedUnit = { ...unit, id: generateArmyUnitId(unit.id) };

    onArmyUpdate((prevArmy) => {
      const updatedArmy = { ...prevArmy };
      switch (category) {
        case 'Characters':
          updatedArmy.characters = [...(prevArmy.characters || []), duplicatedUnit];
          break;
        case 'Battleline':
          updatedArmy.battleline = [...(prevArmy.battleline || []), duplicatedUnit];
          break;
        case 'Dedicated Transports':
          updatedArmy.dedicatedTransports = [
            ...(prevArmy.dedicatedTransports || []),
            duplicatedUnit,
          ];
          break;
        case 'Other Datasheets':
          updatedArmy.otherDatasheets = [...(prevArmy.otherDatasheets || []), duplicatedUnit];
          break;
        case 'Allied Units':
          updatedArmy.alliedUnits = [...(prevArmy.alliedUnits || []), duplicatedUnit];
          break;
      }
      return updatedArmy;
    });
    setOpenMenuId(null);
  };

  const handleMakeWarlord = (unitId: string, category: string) => {
    if (category !== 'Characters') return; // Only characters can be warlord

    onArmyUpdate((prevArmy) => {
      const updatedArmy = { ...prevArmy };
      if (updatedArmy.characters) {
        // remove warlord from all characters, then assign the new one
        updatedArmy.characters = updatedArmy.characters.map((u) => ({
          ...u,
          isWarlord: u.id === unitId,
        }));
      }
      return updatedArmy;
    });
    setOpenMenuId(null);
  };

  const handleUnitUpdate = (update: (prevUnit: Unit) => Unit) => {
    if (!selectedUnitId) return;
    const unitId = selectedUnitId;

    onArmyUpdate((prevArmy) => {
      const updatedArmy = { ...prevArmy };
      for (const cat of [
        'characters',
        'battleline',
        'dedicatedTransports',
        'otherDatasheets',
        'alliedUnits',
      ] as const) {
        const list = prevArmy[cat];
        if (list) {
          const index = list.findIndex((u) => u.id === unitId);
          if (index !== -1) {
            const newList = [...list];
            newList[index] = update(list[index]);
            updatedArmy[cat] = newList;
            return updatedArmy;
          }
        }
      }
      return prevArmy;
    });
  };

  //controls which category is expanded to add available units
  const handleToggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleEditArmy = (updatedData: Partial<Army>) => {
    onArmyUpdate((prevArmy) => ({ ...prevArmy, ...updatedData }));
    setIsEditModalOpen(false);
  };

  const categories = [
    'Characters',
    'Battleline',
    'Dedicated Transports',
    'Other Datasheets',
    'Allied Units',
  ];

  if (selectedUnit) {
    return (
      <UnitDetailTab
        unit={selectedUnit}
        onBack={() => setSelectedUnitId(null)}
        onUpdate={handleUnitUpdate}
      />
    );
  }

  if (isBattleModeOpen) {
    return <BattleModeTab army={army} onBack={() => setIsBattleModeOpen(false)} />;
  }

  return (
    <div className="relative pb-4">
      {/* Static Background at the very top */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-700 z-0"></div>

      {/* Sticky header container for buttons */}
      <div className="sticky top-0 z-40 px-4 py-2 flex justify-between items-center pointer-events-none mb-4">
        <button
          onClick={onBack}
          className="pointer-events-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow-md border border-gray-700 text-sm"
        >
          Back
        </button>
        <button
          onClick={() => setIsBattleModeOpen(true)}
          className="pointer-events-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-[0_0_8px_rgba(220,38,38,0.6)] border border-red-800 text-sm font-bold uppercase tracking-wider"
        >
          Battle Mode
        </button>
        <span
          className={`pointer-events-auto px-3 py-2 rounded text-sm font-bold shadow-md border border-gray-700 ${isOverPoints ? 'bg-red-500 text-white' : 'bg-yellow-400 text-gray-900 dark:text-gray-900'}`}
        >
          {currentPoints} / {army.points} pts
        </span>
      </div>

      <div className="px-4 relative z-10">
        <div
          className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-4 mb-4"
          style={{ boxShadow: '0 0 0 2px #000' }}
        >
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

        <WarlordWarningBanner status={warlordStatus} />

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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Display units in this category */}
                {categoryUnits.length > 0 && (
                  <div className="px-4 pb-3 space-y-2">
                    {categoryUnits.map((unit) => (
                      <div
                        key={unit.id}
                        onClick={() => setSelectedUnitId(unit.id)}
                        className="relative flex justify-between items-center py-3 px-3 bg-gray-100 dark:bg-gray-600 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {unit.name}
                            </span>
                            {unit.isWarlord && (
                              <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-yellow-900 text-[10px] font-bold rounded uppercase tracking-wider">
                                HQ
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {describeUnitComposition(unit)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 mr-3">
                            {getSafeUnitPoints(unit)} pts
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === unit.id ? null : unit.id);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateUnit(unit, category);
                                    }}
                                    className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    Duplicate
                                  </button>
                                  {category === 'Characters' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!unit.isWarlord) {
                                          handleMakeWarlord(unit.id, category);
                                        }
                                      }}
                                      disabled={unit.isWarlord}
                                      className={`w-full text-left px-4 py-2 ${unit.isWarlord ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                      Make Warlord (HQ)
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteUnit(unit.id, category);
                                    }}
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
                    {loading ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400 py-2 animate-pulse">
                        Loading faction data...
                      </div>
                    ) : (
                      <>
                        {availableUnits.map((unit) => (
                          <AvailableUnitRow
                            key={unit.id}
                            unit={unit}
                            onAdd={() => handleAddUnit(unit, category)}
                          />
                        ))}
                        {availableUnits.length === 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                            No units available for this category.
                          </div>
                        )}
                      </>
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

/**
 * Soft, non-blocking advisory banner shown when the army has no designated
 * Warlord. Purely informational — it never disables or gates anything
 * elsewhere on the page. Renders nothing once a Warlord is set.
 */
function WarlordWarningBanner({ status }: { status: WarlordStatus }) {
  if (status.state === 'ok') return null;

  const message =
    status.state === 'no-characters'
      ? 'No Warlord designated. Add a Character unit to the Characters section — one of them will need to be your Warlord.'
      : 'No Warlord designated. Open a Character unit’s ⋮ menu and select "Make Warlord (HQ)" to designate one.';

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-3 py-2 text-sm text-yellow-900 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mt-0.5 h-4 w-4 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.28 11.18c.75 1.334-.213 2.987-1.742 2.987H3.72c-1.53 0-2.492-1.653-1.743-2.987l6.28-11.18zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
}

function AvailableUnitRow({ unit, onAdd }: { unit: Unit; onAdd: () => void }) {
  const [expanded, setExpanded] = useState(false);
  // Task 6.4 schema: prefer the unit's modelGroups for the preview
  // statline, falling back to legacy profiles/stats so unmigrated or
  // malformed data can never crash this row.
  const displayStats = getDisplayStats(unit);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded overflow-hidden mb-2 border border-transparent dark:border-blue-800/50">
      <div
        className="flex justify-between items-center py-2 px-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-medium dark:text-white text-gray-900">{unit.name}</span>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {getUnitPickerPrice(unit)} pts
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 border-t border-blue-200 dark:border-blue-800/50 text-sm bg-white dark:bg-gray-800">
          <div className="mb-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-xs uppercase">
              Stats
            </h4>
            <div className="grid grid-cols-6 gap-1 text-center bg-gray-50 dark:bg-gray-900 rounded p-2">
              <div>
                <div className="text-[10px] text-gray-500">M</div>
                <div className="font-medium text-gray-900 dark:text-gray-300">
                  {displayStats.movement}&quot;
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">T</div>
                <div className="font-medium text-gray-900 dark:text-gray-300">
                  {displayStats.toughness}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">SV</div>
                <div className="font-medium text-gray-900 dark:text-gray-300">
                  {displayStats.save}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">W</div>
                <div className="font-medium text-gray-900 dark:text-gray-300">
                  {displayStats.wounds}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">LD</div>
                <div className="font-medium text-gray-900 dark:text-gray-300">
                  {displayStats.leadership}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">OC</div>
                <div className="font-medium text-gray-900 dark:text-gray-300">
                  {displayStats.objectiveControl}
                </div>
              </div>
            </div>
          </div>

          {unit.weapons && unit.weapons.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-xs uppercase">
                Weapons
              </h4>
              <div className="space-y-1">
                {unit.weapons.map((w) => (
                  <div
                    key={w.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs grid grid-cols-12 gap-1 items-center"
                  >
                    <div
                      className="col-span-5 font-medium text-gray-900 dark:text-gray-300 truncate"
                      title={w.name}
                    >
                      {w.name}
                    </div>
                    <div
                      className="col-span-2 text-center text-gray-600 dark:text-gray-400"
                      title="Range"
                    >
                      {w.range === 'Melee' ? 'Melee' : `${w.range}"`}
                    </div>
                    <div
                      className="col-span-1 text-center text-gray-600 dark:text-gray-400"
                      title="Attacks"
                    >
                      {w.attacks}
                    </div>
                    <div
                      className="col-span-3 text-center text-gray-600 dark:text-gray-400"
                      title="Strength / AP"
                    >
                      S{w.strength} AP{w.armourPenetration}
                    </div>
                    <div
                      className="col-span-1 text-center text-gray-600 dark:text-gray-400"
                      title="Damage"
                    >
                      {w.damage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
