import { useTheme } from './ThemeContext';

interface ProfileTabProps {}

export default function ProfileTab({}: ProfileTabProps) {
  const { theme, toggleTheme } = useTheme();
  return (
    <section className="mx-4">
      <h2 className="text-2xl font-bold uppercase mb-4">Profile</h2>
      <p className="text-gray-400 mb-4">User profile and settings go here.</p>
      <div className="flex items-center space-x-4 mt-4">
        <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-400'}`}>DARK</span>
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
        <span className={`font-semibold transition-colors ${theme === 'light' ? 'text-gray-900' : 'text-gray-400'}`}>LIGHT</span>
      </div>
    </section>
  );
}
