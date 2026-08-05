import React, { useState } from 'react';
import { ModelGroup, Unit, UnitStats } from '../types/army';
import { calculateUnitPoints, normalizeModelGroupComposition } from '../utils/unitUtils';

interface UnitDetailTabProps {
  unit: Unit;
  onBack: () => void;
  // Functional updater rather than a plain Unit: the caller resolves this
  // against the latest committed unit state (not a snapshot captured at
  // render time), so rapid successive calls all apply instead of racing
  // against a stale `unit` prop and silently dropping updates.
  onUpdate: (update: (prevUnit: Unit) => Unit) => void;
}

/** Six-characteristic (M/T/SV/W/LD/OC) statline, optionally labeled. */
function StatGrid({ label, stats }: { label?: string; stats: UnitStats }) {
  return (
    <div className="flex flex-col">
      {label && <span className="text-xs text-gray-300 font-bold mb-1">{label}</span>}
      <div className="grid grid-cols-6 gap-1 text-center bg-gray-900 rounded p-2 border border-gray-700">
        <div>
          <div className="text-[10px] text-gray-500">M</div>
          <div className="font-medium text-white">{stats.movement}&quot;</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">T</div>
          <div className="font-medium text-white">{stats.toughness}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">SV</div>
          <div className="font-medium text-white">{stats.save}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">W</div>
          <div className="font-medium text-white">{stats.wounds}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">LD</div>
          <div className="font-medium text-white">{stats.leadership}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">OC</div>
          <div className="font-medium text-white">{stats.objectiveControl}</div>
        </div>
      </div>
    </div>
  );
}

/** Independent [-]/count/[+] counter for a single ModelGroup, clamped to its own min/max. */
function ModelGroupCounter({
  group,
  current,
  onChange,
}: {
  group: ModelGroup;
  current: number;
  onChange: (delta: number) => void;
}) {
  const canDecrease = current > group.minQuantity;
  const canIncrease = current < group.maxQuantity;

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-sm">{group.name}</div>
        <div className="text-xs text-gray-400">
          Min: {group.minQuantity} | Max: {group.maxQuantity}
        </div>
      </div>
      <div className="flex items-center space-x-3 bg-gray-900 rounded-lg p-1 border border-gray-700">
        <button
          onClick={() => onChange(-1)}
          disabled={!canDecrease}
          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${canDecrease ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
        >
          -
        </button>
        <span className="font-bold text-base min-w-[2ch] text-center">{current}</span>
        <button
          onClick={() => onChange(1)}
          disabled={!canIncrease}
          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${canIncrease ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function UnitDetailTab({ unit, onBack, onUpdate }: UnitDetailTabProps) {
  const [isCompositionOpen, setIsCompositionOpen] = useState(true);
  const [isWargearOpen, setIsWargearOpen] = useState(true);

  const modelGroups =
    unit.modelGroups && Object.keys(unit.modelGroups).length > 0 ? unit.modelGroups : null;

  // Task 6.4 schema: composition normalized against this unit's modelGroups.
  // normalizeModelGroupComposition defensively drops unknown/stale keys
  // (e.g. an older army saved with composition keyed by legacy Profile name)
  // so a mismatched localStorage army can never crash this screen.
  const modelGroupComposition = modelGroups
    ? normalizeModelGroupComposition(unit, unit.composition)
    : {};

  // Legacy fallback composition, keyed by Profile name (pre Task 6.4 data).
  const legacyComposition = unit.composition || {};
  if (!modelGroups && Object.keys(legacyComposition).length === 0 && unit.profiles) {
    unit.profiles.forEach((p) => {
      legacyComposition[p.name] = p.minQuantity;
    });
  }

  const handleModelGroupChange = (group: ModelGroup, delta: number) => {
    // Derive `current` from the latest committed unit (prevUnit), not the
    // `modelGroupComposition` closed over from this render's `unit` prop —
    // otherwise clicks that land before a render round-trip read stale data
    // and get silently dropped.
    onUpdate((prevUnit) => {
      const prevComposition = normalizeModelGroupComposition(prevUnit, prevUnit.composition);
      const current = prevComposition[group.id] ?? group.minQuantity;
      const next = Math.max(group.minQuantity, Math.min(group.maxQuantity, current + delta));

      const newComposition = { ...prevComposition, [group.id]: next };
      const updatedUnit: Unit = { ...prevUnit, composition: newComposition };
      updatedUnit.totalPoints = calculateUnitPoints(updatedUnit, updatedUnit.selectedOptions);
      return updatedUnit;
    });
  };

  const handleCompositionChange = (
    profileName: string,
    delta: number,
    min: number,
    max: number
  ) => {
    onUpdate((prevUnit) => {
      const prevLegacyComposition = prevUnit.composition || {};
      const current = prevLegacyComposition[profileName] || min;
      const next = Math.max(min, Math.min(max, current + delta));

      const newComposition = { ...prevLegacyComposition, [profileName]: next };
      const updatedUnit: Unit = { ...prevUnit, composition: newComposition };
      updatedUnit.totalPoints = calculateUnitPoints(updatedUnit, updatedUnit.selectedOptions);
      return updatedUnit;
    });
  };

  const handleLegacyQuantityChange = (delta: number) => {
    onUpdate((prevUnit) => {
      const current = prevUnit.quantity || 1;
      const next = Math.max(1, current + delta);
      const updatedUnit: Unit = { ...prevUnit, quantity: next };
      updatedUnit.totalPoints = calculateUnitPoints(updatedUnit, updatedUnit.selectedOptions);
      return updatedUnit;
    });
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
          {unit.totalPoints ?? unit.basePoints} pts
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

            {modelGroups ? (
              <div className="space-y-2">
                {Object.values(modelGroups).map((group) => (
                  <StatGrid key={group.id} label={group.name} stats={group.stats} />
                ))}
              </div>
            ) : unit.profiles && unit.profiles.length > 0 ? (
              <div className="space-y-2">
                {unit.profiles.map((profile) => (
                  <StatGrid key={profile.name} label={profile.name} stats={profile.stats} />
                ))}
              </div>
            ) : (
              <StatGrid stats={unit.stats} />
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
              {modelGroups ? (
                <div className="space-y-3 mb-4">
                  {Object.values(modelGroups).map((group) => (
                    <ModelGroupCounter
                      key={group.id}
                      group={group}
                      current={modelGroupComposition[group.id] ?? group.minQuantity}
                      onChange={(delta) => handleModelGroupChange(group, delta)}
                    />
                  ))}
                </div>
              ) : unit.profiles && unit.profiles.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {unit.profiles.map((profile) => {
                    const current = legacyComposition[profile.name] ?? profile.minQuantity;
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
                  {unit.totalPoints ?? unit.basePoints} pts
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
