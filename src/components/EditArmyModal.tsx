'use client';

import { useState, useEffect } from 'react';
import { Army } from '../types/army';

interface EditArmyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<Army>) => void;
  army: Army;
}

export default function EditArmyModal({ isOpen, onClose, onSubmit, army }: EditArmyModalProps) {
  const [formData, setFormData] = useState({
    armyName: army.armyName,
    faction: army.faction,
    detachment: army.detachment,
    points: army.points,
  });

  useEffect(() => {
    setFormData({
      armyName: army.armyName,
      faction: army.faction,
      detachment: army.detachment,
      points: army.points,
    });
  }, [army]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'points') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 100 }}>
      <div className="rounded-lg p-6 w-full max-w-md mx-auto shadow-lg bg-gray-800 dark:bg-gray-800 bg-white text-gray-900 dark:text-white">
        <h3 className="text-xl font-bold mb-4">Edit Army</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center mb-2">
            <label className="w-32 text-sm font-medium mr-2 text-gray-700 dark:text-gray-300" htmlFor="armyName">
              Army Name
            </label>
            <input
              id="armyName"
              name="armyName"
              type="text"
              value={formData.armyName}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="flex items-center mb-2">
            <label className="w-32 text-sm font-medium mr-2 text-gray-700 dark:text-gray-300" htmlFor="faction">
              Faction
            </label>
            <input
              id="faction"
              name="faction"
              type="text"
              value={formData.faction}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="flex items-center mb-2">
            <label className="w-32 text-sm font-medium mr-2 text-gray-700 dark:text-gray-300" htmlFor="detachment">
              Detachment
            </label>
            <input
              id="detachment"
              name="detachment"
              type="text"
              value={formData.detachment}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="flex items-center mb-2">
            <label className="w-32 text-sm font-medium mr-2 text-gray-700 dark:text-gray-300" htmlFor="points">
              Points Limit
            </label>
            <input
              id="points"
              name="points"
              type="number"
              min="1"
              step="1"
              value={formData.points}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
