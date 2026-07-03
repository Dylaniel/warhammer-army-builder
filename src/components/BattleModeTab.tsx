import React, { useState, useMemo } from 'react';
import { Army, GamePhase } from '../types/army';

interface BattleModeTabProps {
  army: Army;
  onBack: () => void;
}

interface BattleModeRule {
  unitName: string;
  ruleName: string;
  description: string;
  source: 'Ability' | 'Unit Detachment Bonus' | 'Weapon Detachment Bonus';
  weaponName?: string;
  phase: string[];
}

export function useBattleModeRules(army: Army, activePhase: GamePhase | 'All') {
  return useMemo(() => {
    const rules: BattleModeRule[] = [];
    const allUnits = [
      ...(army.characters || []),
      ...(army.battleline || []),
      ...(army.dedicatedTransports || []),
      ...(army.otherDatasheets || []),
      ...(army.alliedUnits || []),
    ];

    allUnits.forEach((unit) => {
      // 1. Abilities
      if (unit.abilities) {
        unit.abilities.forEach((ability) => {
          if (typeof ability === 'string') {
            rules.push({
              unitName: unit.name,
              ruleName: ability,
              description: 'See datasheet for details.',
              source: 'Ability',
              phase: [],
            });
          } else {
            rules.push({
              unitName: unit.name,
              ruleName: ability.name,
              description: ability.description,
              source: 'Ability',
              phase: ability.phase || [],
            });
          }
        });
      }

      // 2. Unit Detachment Bonuses
      if (unit.detachmentBonuses) {
        unit.detachmentBonuses.forEach((bonus) => {
          if (bonus.validationKeys.includes(army.detachment)) {
            rules.push({
              unitName: unit.name,
              ruleName: bonus.name,
              description: bonus.description,
              source: 'Unit Detachment Bonus',
              phase: bonus.phase || [],
            });
          }
        });
      }

      // 3. Weapon Detachment Bonuses
      if (unit.weapons) {
        unit.weapons.forEach((weapon) => {
          if (weapon.detachmentBonuses) {
            weapon.detachmentBonuses.forEach((bonus) => {
              if (bonus.validationKeys.includes(army.detachment)) {
                rules.push({
                  unitName: unit.name,
                  ruleName: bonus.name,
                  description: bonus.description,
                  source: 'Weapon Detachment Bonus',
                  weaponName: weapon.name,
                  phase: bonus.phase || [],
                });
              }
            });
          }
        });
      }
    });

    if (activePhase === 'All') {
      return rules;
    }

    return rules.filter(rule => {
      return !rule.phase || rule.phase.length === 0 || rule.phase.includes('Any') || rule.phase.includes(activePhase as any);
    });
  }, [army, activePhase]);
}

const PHASES: (GamePhase | 'All')[] = ['All', 'Command', 'Movement', 'Shooting', 'Charge', 'Fight'];

export default function BattleModeTab({ army, onBack }: BattleModeTabProps) {
  const [activePhase, setActivePhase] = useState<GamePhase | 'All'>('All');
  const rules = useBattleModeRules(army, activePhase);

  return (
    <div className="relative pb-4 min-h-full flex flex-col bg-gray-900 text-white">
      {/* Top Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex justify-between items-center bg-gray-800 border-b border-gray-700 shadow-md">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 shadow-sm border border-gray-600 text-sm font-medium transition-colors"
        >
          &larr; Back
        </button>
        <h2 className="text-lg font-bold text-red-500 uppercase tracking-widest">
          Battle Mode
        </h2>
      </div>

      {/* Phase Selector */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 sticky top-[53px] z-30 shadow-md">
        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">
          Active Game Phase
        </label>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {PHASES.map((phase) => (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              className={"px-4 py-2 rounded text-sm font-bold whitespace-nowrap transition-colors " + (activePhase === phase ? "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-gray-700 text-gray-300 hover:bg-gray-600")}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-900">
        {rules.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>No rules or abilities active in this phase.</p>
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div key={idx} className="bg-gray-800 rounded-lg p-3 border border-gray-700 shadow-sm relative overflow-hidden">
              <div className={"absolute left-0 top-0 bottom-0 w-1 " + (rule.source === 'Ability' ? 'bg-blue-500' : rule.source === 'Unit Detachment Bonus' ? 'bg-purple-500' : 'bg-green-500')} />
              
              <div className="ml-2">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-md text-gray-100">{rule.ruleName}</h3>
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
                    {rule.unitName}
                  </span>
                </div>
                
                <div className="text-xs text-gray-400 mb-2 font-medium flex items-center space-x-2">
                  <span className={"px-1.5 py-0.5 rounded text-[10px] text-white " + (rule.source === 'Ability' ? 'bg-blue-600' : rule.source === 'Unit Detachment Bonus' ? 'bg-purple-600' : 'bg-green-600')}>
                    {rule.source}
                  </span>
                  {rule.weaponName && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-white bg-red-800">
                      Weapon: {rule.weaponName}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {rule.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
