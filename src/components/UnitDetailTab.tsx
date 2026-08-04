import React, { useState } from 'react';
import { Unit } from '../types/army';
import { calculateUnitPoints } from '../utils/unitUtils';

interface UnitDetailTabProps {
  unit: Unit;
  onBack: () => void;
  onUpdate: (updatedUnit: Unit) => void;
}

export default function UnitDetailTab({ unit, onBack, onUpdate }: UnitDetailTabProps) {
  const [isCompositionOpen, setIsCompositionOpen] = useState(true);
  const [isWargearOpen, setIsWargearOpen] = useState(true);

  // Initialize composition if not present, but profiles exist
  const currentComposition = unit.composition || {};
  if (Object.keys(currentComposition).length === 0 && unit.profiles) {
    unit.profiles.forEach((p) => {
      currentComposition[p.name] = p.minQuantity;
    });
  }

  const handleCompositionChange = (
    profileName: string,
    delta: number,
    min: number,
    max: number
  ) => {
    const current = currentComposition[profileName] || min;
    const next = Math.max(min, Math.min(max, current + delta));

    const newComposition = { ...currentComposition, [profileName]: next };
    const updatedUnit = { ...unit, composition: newComposition };
    updatedUnit.totalPoints = calculateUnitPoints(updatedUnit, updatedUnit.selectedOptions);

    onUpdate(updatedUnit);
  };

  const handleLegacyQuantityChange = (delta: number) => {
    const current = unit.quantity || 1;
    const next = Math.max(1, current + delta);
    const updatedUnit = { ...unit, quantity: next };
    updatedUnit.totalPoints = calculateUnitPoints(updatedUnit, updatedUnit.selectedOptions);

    onUpdate(updatedUnit);
  };

  return (
    <div className="relative pb-4">
      {/* Static Background at the very top */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-700 z-0"></div>

      <div className="sticky top-0 z-40 px-4 py-2 flex justify-between items-center pointer-events-none mb-4">
        <button
          onClick={onBack}
          className="pointer-events-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow-md border border-gray-700"
        >
          Back to Roster
        </button>
        <span className="pointer-events-auto px-3 py-2 rounded text-sm font-bold shadow-md border border-gray-700 bg-gray-800 text-white">
          {unit.totalPoints || unit.basePoints} pts
        </span>
      </div>

      <div className="px-4 relative z-10 space-y-4">
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <h2 className="text-xl font-bold uppercase text-white mb-2">{unit.name}</h2>

          {/* Stat Block */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-400 mb-1 text-xs uppercase tracking-wider">
              Stats
            </h4>

            {unit.profiles && unit.profiles.length > 0 ? (
              <div className="space-y-2">
                {unit.profiles.map((profile) => (
                  <div key={profile.name} className="flex flex-col">
                    <span className="text-xs text-gray-300 font-bold mb-1">{profile.name}</span>
                    <div className="grid grid-cols-6 gap-1 text-center bg-gray-900 rounded p-2 border border-gray-700">
                      <div>
                        <div className="text-[10px] text-gray-500">M</div>
                        <div className="font-medium text-white">{profile.stats.movement}&quot;</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500">T</div>
                        <div className="font-medium text-white">{profile.stats.toughness}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500">SV</div>
                        <div className="font-medium text-white">{profile.stats.save}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500">W</div>
                        <div className="font-medium text-white">{profile.stats.wounds}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500">LD</div>
                        <div className="font-medium text-white">{profile.stats.leadership}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500">OC</div>
                        <div className="font-medium text-white">
                          {profile.stats.objectiveControl}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-1 text-center bg-gray-900 rounded p-2 border border-gray-700">
                <div>
                  <div className="text-[10px] text-gray-500">M</div>
                  <div className="font-medium text-white">{unit.stats.movement}&quot;</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">T</div>
                  <div className="font-medium text-white">{unit.stats.toughness}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">SV</div>
                  <div className="font-medium text-white">{unit.stats.save}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">W</div>
                  <div className="font-medium text-white">{unit.stats.wounds}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">LD</div>
                  <div className="font-medium text-white">{unit.stats.leadership}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">OC</div>
                  <div className="font-medium text-white">{unit.stats.objectiveControl}</div>
                </div>
              </div>
            )}
          </div>

          {/* Weapons */}
          {unit.weapons && unit.weapons.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-400 mb-1 text-xs uppercase tracking-wider">
                Weapons
              </h4>
              <div className="grid grid-cols-12 gap-1 px-2 mb-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                <div className="col-span-5">Weapon</div>
                <div className="col-span-2 text-center">Range</div>
                <div className="col-span-1 text-center">A</div>
                <div className="col-span-3 text-center">S / AP</div>
                <div className="col-span-1 text-center">D</div>
              </div>
              <div className="space-y-1">
                {unit.weapons.map((w) => (
                  <div
                    key={w.id}
                    className="bg-gray-900 rounded p-2 text-xs grid grid-cols-12 gap-1 items-center border border-gray-700"
                  >
                    <div className="col-span-5 font-medium text-white truncate" title={w.name}>
                      {w.name}
                    </div>
                    <div className="col-span-2 text-center text-gray-400" title="Range">
                      {w.range === 'Melee' ? 'Melee' : `${w.range}"`}
                    </div>
                    <div className="col-span-1 text-center text-gray-400" title="Attacks">
                      {w.attacks}
                    </div>
                    <div className="col-span-3 text-center text-gray-400" title="Strength / AP">
                      S{w.strength} AP{w.armourPenetration}
                    </div>
                    <div className="col-span-1 text-center text-gray-400" title="Damage">
                      {w.damage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abilities */}
          {unit.abilities && unit.abilities.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-400 mb-1 text-xs uppercase tracking-wider">
                Abilities
              </h4>
              <div className="bg-gray-900 rounded p-2 border border-gray-700">
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {unit.abilities.map((ability, idx) =>
                    typeof ability === 'string' ? (
                      <li key={idx}>{ability}</li>
                    ) : (
                      <li key={idx}>
                        <span className="font-bold text-white">{ability.name}:</span>{' '}
                        {ability.description}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Unit Composition Accordion */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <button
            className="w-full flex justify-between items-center p-4 bg-gray-700 text-white font-bold uppercase hover:bg-gray-600 transition-colors"
            onClick={() => setIsCompositionOpen(!isCompositionOpen)}
          >
            <span>Unit Composition</span>
            <span>{isCompositionOpen ? '▼' : '▶'}</span>
          </button>
          {isCompositionOpen && (
            <div className="p-4 text-white">
              {unit.profiles && unit.profiles.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {unit.profiles.map((profile) => {
                    const current = currentComposition[profile.name] ?? profile.minQuantity;
                    const canDecrease = current > profile.minQuantity;
                    const canIncrease = current < profile.maxQuantity;
                    return (
                      <div key={profile.name} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{profile.name}</div>
                          <div className="text-xs text-gray-400">
                            Min: {profile.minQuantity} | Max: {profile.maxQuantity}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-gray-900 rounded-lg p-1 border border-gray-700">
                          <button
                            onClick={() =>
                              handleCompositionChange(
                                profile.name,
                                -1,
                                profile.minQuantity,
                                profile.maxQuantity
                              )
                            }
                            disabled={!canDecrease}
                            className={`w-8 h-8 flex items-center justify-center rounded font-bold ${canDecrease ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                          >
                            -
                          </button>
                          <span className="font-bold text-base min-w-[2ch] text-center">
                            {current}
                          </span>
                          <button
                            onClick={() =>
                              handleCompositionChange(
                                profile.name,
                                1,
                                profile.minQuantity,
                                profile.maxQuantity
                              )
                            }
                            disabled={!canIncrease}
                            className={`w-8 h-8 flex items-center justify-center rounded font-bold ${canIncrease ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-medium text-lg">Model Quantity</div>
                    <div className="text-sm text-gray-400">Scale the unit size (Legacy)</div>
                  </div>
                  <div className="flex items-center space-x-4 bg-gray-900 rounded-lg p-2 border border-gray-700">
                    <button
                      onClick={() => handleLegacyQuantityChange(-1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg min-w-[2ch] text-center">
                      {unit.quantity || 1}
                    </span>
                    <button
                      onClick={() => handleLegacyQuantityChange(1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-400 border-t border-gray-700 pt-3">
                Total unit cost:{' '}
                <span className="font-bold text-yellow-400">
                  {unit.totalPoints || unit.basePoints} pts
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wargear Options Accordion */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <button
            className="w-full flex justify-between items-center p-4 bg-gray-700 text-white font-bold uppercase hover:bg-gray-600 transition-colors"
            onClick={() => setIsWargearOpen(!isWargearOpen)}
          >
            <span>Wargear Options</span>
            <span>{isWargearOpen ? '▼' : '▶'}</span>
          </button>
          {isWargearOpen && (
            <div className="p-4 text-gray-300 text-sm">
              <p>Default Loadout (Barebones)</p>
              <p className="text-xs text-gray-500 mt-1">
                No alternative wargear options are currently available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
