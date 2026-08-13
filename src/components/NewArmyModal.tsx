'use client';

import { useState } from 'react';
import { Unit } from '../types/army';
import { SUPPORTED_FACTIONS } from '../utils/unitUtils';
import { FACTION_DETACHMENTS } from '../data/detachments';
import { parseAndValidateArmyJson } from '../utils/armyIO';

interface NewArmyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    armyName: string;
    faction: string;
    detachment: string;
    points: number;
    characters: Unit[];
    battleline: Unit[];
    dedicatedTransports: Unit[];
    otherDatasheets: Unit[];
    alliedUnits: Unit[];
  }) => void;
}

export default function NewArmyModal({ isOpen, onClose, onSubmit }: NewArmyModalProps) {
  const [formData, setFormData] = useState({
    armyName: '',
    faction: '',
    detachment: '',
    points: 2000,
  });
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      characters: [],
      battleline: [],
      dedicatedTransports: [],
      otherDatasheets: [],
      alliedUnits: [],
    });
    setFormData({ armyName: '', faction: '', detachment: '', points: 2000 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'points') {
      // Only allow positive integers
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
        // If invalid input, don't update the state
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'faction') {
      setFormData((prev) => ({
        ...prev,
        faction: value,
        detachment: '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Parses/validates the pasted JSON via armyIO (all validation logic lives
  // there, not here) and, on success, reconstructs the army through the
  // same `onSubmit` path as manual creation. Wrapped in try/catch as a
  // last-resort guard — `parseAndValidateArmyJson` itself never throws —
  // so a pasted payload can never propagate an unhandled exception into
  // the React tree.
  const handleImport = () => {
    try {
      const result = parseAndValidateArmyJson(importText);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      setImportError(null);
      if (result.warning) {
        // Faction not in SUPPORTED_FACTIONS: per Task 6.7 this warns but
        // never blocks the import. window.alert guarantees the user sees
        // it even though this modal closes immediately after onSubmit.
        window.alert(result.warning);
      }
      onSubmit(result.army);
      setImportText('');
      setShowImport(false);
    } catch {
      setImportError(
        'Something went wrong importing this army. Please check the JSON and try again.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rounded-lg p-6 w-full max-w-md mx-auto mb-4 shadow-lg bg-gray-800 dark:bg-gray-800 bg-white text-white dark:text-white text-gray-900">
      <h3 className="text-xl font-bold mb-4 dark:text-white text-gray-900">Create New Army</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center mb-2">
          <label
            className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700"
            htmlFor="armyName"
          >
            {'Army Name'}
          </label>
          <input
            id="armyName"
            name="armyName"
            type="text"
            value={formData.armyName}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 rounded bg-gray-700 dark:bg-gray-700 bg-gray-100 focus:outline-none focus:ring text-white dark:text-white text-gray-900"
            placeholder="Enter army name"
            required
          />
        </div>
        <div className="flex items-center mb-2">
          <label
            className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700"
            htmlFor="faction"
          >
            {'Faction'}
          </label>
          <select
            id="faction"
            name="faction"
            value={formData.faction}
            onChange={handleSelectChange}
            className="flex-1 px-3 py-2 rounded bg-gray-700 dark:bg-gray-700 bg-gray-100 focus:outline-none focus:ring text-white dark:text-white text-gray-900"
            required
          >
            <option value="" disabled>
              Select a Faction...
            </option>
            {SUPPORTED_FACTIONS.map((faction) => (
              <option key={faction} value={faction}>
                {faction}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center mb-2">
          <label
            className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700"
            htmlFor="detachment"
          >
            {'Detachment'}
          </label>
          <select
            id="detachment"
            name="detachment"
            value={formData.detachment}
            onChange={handleSelectChange}
            className="flex-1 px-3 py-2 rounded bg-gray-700 dark:bg-gray-700 bg-gray-100 focus:outline-none focus:ring text-white dark:text-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={!formData.faction}
          >
            <option value="" disabled>
              Select a Detachment...
            </option>
            {formData.faction &&
              FACTION_DETACHMENTS[formData.faction]?.map((det) => (
                <option key={det} value={det}>
                  {det}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-center mb-2">
          <label
            className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700"
            htmlFor="points"
          >
            {'Points'}
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min="1"
            step="1"
            value={formData.points}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 rounded bg-gray-700 dark:bg-gray-700 bg-gray-100 focus:outline-none focus:ring text-white dark:text-white text-gray-900"
            placeholder="2000"
            required
          />
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-600 rounded hover:bg-gray-500 text-white dark:text-white text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 rounded text-black dark:text-black text-white"
          >
            Create
          </button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-600 dark:border-gray-600">
        <button
          type="button"
          onClick={() => setShowImport((prev) => !prev)}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 underline"
        >
          {showImport ? 'Hide Import' : 'Import Army from JSON'}
        </button>

        {showImport && (
          <div className="mt-3 space-y-2">
            <label
              className="block text-sm font-medium mb-1 dark:text-gray-300 text-gray-700"
              htmlFor="importJson"
            >
              Paste an exported army JSON string
            </label>
            <textarea
              id="importJson"
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                if (importError) setImportError(null);
              }}
              rows={6}
              placeholder="Paste JSON exported from another army here..."
              className="w-full px-3 py-2 rounded bg-gray-700 dark:bg-gray-700 bg-gray-100 focus:outline-none focus:ring text-white dark:text-white text-gray-900 text-xs font-mono"
            />
            {importError && (
              <div role="alert" className="text-sm text-red-400 dark:text-red-400">
                {importError}
              </div>
            )}
            <button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className={`w-full px-4 py-2 rounded font-bold transition-colors ${
                importText.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Import Army
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
