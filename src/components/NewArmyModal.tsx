'use client';

import { useState } from 'react';

interface NewArmyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    armyName: string;
    faction: string;
    detachment: string;
    points: number;
  }) => void;
}

export default function NewArmyModal({ isOpen, onClose, onSubmit }: NewArmyModalProps) {
  const [formData, setFormData] = useState({
    armyName: '',
    faction: '',
    detachment: '',
    points: 2000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ armyName: '', faction: '', detachment: '', points: 2000 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) || 0 : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="rounded-lg p-6 w-full max-w-md mx-auto mb-4 shadow-lg bg-gray-800 dark:bg-gray-800 bg-white text-white dark:text-white text-gray-900">
      <h3 className="text-xl font-bold mb-4 dark:text-white text-gray-900">Create New Army</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center mb-2">
          <label className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700" htmlFor="armyName">
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
          <label className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700" htmlFor="faction">
            {'Faction'}
          </label>
          <input
            id="faction"
            name="faction"
            type="text"
            value={formData.faction}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 rounded bg-gray-700 dark:bg-gray-700 bg-gray-100 focus:outline-none focus:ring text-white dark:text-white text-gray-900"
            placeholder="e.g. Ultramarines"
            required
          />
        </div>
        <div className="flex items-center mb-2">
          <label className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700" htmlFor="detachment">
            {'Detachment'}
          </label>
          <input
            id="detachment"
            name="detachment"
            type="text"
            value={formData.detachment}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 rounded bg-gray-700 dark:bg-gray-700 bg-gray-100 focus:outline-none focus:ring text-white dark:text-white text-gray-900"
            placeholder="e.g. Firestorm assualt force"
            required
          />
        </div>
        <div className="flex items-center mb-2">
          <label className="w-32 text-sm font-medium mr-2 dark:text-gray-300 text-gray-700" htmlFor="points">
            {'Points'}
          </label>
          <input
            id="points"
            name="points"
            type="number"
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
          <button type="submit" className="px-4 py-2 bg-green-600 rounded text-black dark:text-black text-white">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
