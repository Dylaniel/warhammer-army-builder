import { useState } from 'react';
import { useTheme } from './ThemeContext';
import { Army } from '../types/army';

interface ProfileTabProps {
  armies: Army[];
  setArmies: React.Dispatch<React.SetStateAction<Army[]>>;
}

export default function ProfileTab({ armies, setArmies }: ProfileTabProps) {
  const { theme, toggleTheme } = useTheme();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearArmies = () => {
    setArmies([]);
    setShowConfirm(false);
  };

  return (
    <section className="mx-4 mt-4 mb-20">
      <h2 className="text-2xl font-bold uppercase mb-4 dark:text-white text-gray-900">Profile</h2>

      {/* Settings section */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 dark:text-white text-gray-900">App Settings</h3>
        <div className="flex items-center space-x-4">
          <span
            className={`font-semibold transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-400'}`}
          >
            DARK
          </span>
          <button
            onClick={toggleTheme}
            aria-label="Toggle light/dark mode"
            className="relative w-20 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center transition-colors focus:outline-none border border-gray-400 dark:border-gray-600"
          >
            {/* Circle */}
            <span
              className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-gray-700 dark:bg-gray-200 shadow-md transition-all duration-300 ${theme === 'light' ? 'translate-x-10 bg-gray-700' : 'translate-x-0 bg-gray-200 dark:bg-gray-200'}`}
              style={{ transform: theme === 'light' ? 'translateX(40px)' : 'translateX(0)' }}
            />
          </button>
          <span
            className={`font-semibold transition-colors ${theme === 'light' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            LIGHT
          </span>
        </div>
      </div>

      {/* Data Management section */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 dark:text-white text-gray-900">
          Data Management
        </h3>
        <p className="dark:text-gray-300 text-gray-700 mb-4">
          You currently have <strong>{armies.length}</strong>{' '}
          {armies.length === 1 ? 'army' : 'armies'} saved.
        </p>

        {showConfirm ? (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              Are you sure you want to delete all armies? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleClearArmies}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-bold rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={armies.length === 0}
            className={`px-4 py-2 rounded text-sm font-bold ${
              armies.length === 0
                ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Clear All Armies
          </button>
        )}
      </div>
    </section>
  );
}
