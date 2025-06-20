'use client';

interface BottomNavigationProps {
  activeTab: 'reference' | 'battleForge' | 'profile';
  onTabChange: (tab: 'reference' | 'battleForge' | 'profile') => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 flex items-center h-16">
      <button
        onClick={() => onTabChange('reference')}
        className={`flex flex-col items-center space-y-1 flex-1 min-w-0 ${
          activeTab === 'reference' ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'
        }`}
        style={{ width: '33.333%' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 2a2 2 0 00-2 2v12a2 2 0 002 2h8V2H8zm2 2h6v12h-6V4zM2 6v10a2 2 0 002 2h2V4H4a2 2 0 00-2 2z"/>
        </svg>
        <span className="text-xs font-bold uppercase">Reference</span>
      </button>
      
      <button
        onClick={() => onTabChange('battleForge')}
        className={`flex flex-col items-center space-y-1 flex-1 min-w-0 ${
          activeTab === 'battleForge' ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'
        }`}
        style={{ width: '33.333%' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2l2.39 4.84 5.35.78-3.87 3.77.91 5.32L10 13.77l-4.78 2.52.91-5.32L2.26 7.62l5.35-.78L10 2z"/>
        </svg>
        <span className="text-xs font-bold uppercase">Battle Forge</span>
      </button>
      
      <button
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center space-y-1 flex-1 min-w-0 ${
          activeTab === 'profile' ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'
        }`}
        style={{ width: '33.333%' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a5 5 0 100 10 5 5 0 000-10zm-7 14a7 7 0 0114 0H3z" clipRule="evenodd"/>
        </svg>
        <span className="text-xs font-bold uppercase">Profile</span>
      </button>
    </nav>
  );
} 