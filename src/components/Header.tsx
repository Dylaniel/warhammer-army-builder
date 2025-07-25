import { useTheme } from './ThemeContext';

export default function Header() {
  const { theme } = useTheme();
  return (
    <header className={`flex items-center justify-between px-4 h-16 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
      <h1 className={`italic text-xl font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Battle Forge</h1>
    </header>
  );
}
