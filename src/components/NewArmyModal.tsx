'use client';

import { useState } from 'react';

interface NewArmyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: { armyName: string; faction: string; points: number }) => void;
}

export default function NewArmyModal({ isOpen, onClose, onSubmit }: NewArmyModalProps) {
  const [formData, setFormData] = useState({
    armyName: '',
    faction: '',
    points: 2000
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ armyName: '', faction: '', points: 2000 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) || 0 : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 w-11/12 max-w-md">
        <h3 className="text-xl font-bold mb-4">Create New Army</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="armyName">
              Army Name
            </label>
            <input
              id="armyName"
              name="armyName"
              type="text"
              value={formData.armyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded bg-gray-700 focus:outline-none focus:ring"
              placeholder="Enter army name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="faction">
              Faction
            </label>
            <input
              id="faction"
              name="faction"
              type="text"
              value={formData.faction}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded bg-gray-700 focus:outline-none focus:ring"
              placeholder="e.g. Ultramarines"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="points">
              Points
            </label>
            <input
              id="points"
              name="points"
              type="number"
              value={formData.points}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded bg-gray-700 focus:outline-none focus:ring"
              placeholder="2000"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-400"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 