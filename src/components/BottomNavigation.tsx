'use client';

interface BottomNavigationProps {
  activeTab: 'reference' | 'battleForge' | 'profile';
  onTabChange: (tab: 'reference' | 'battleForge' | 'profile') => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="w-full flex items-stretch h-16">
      <button
        onClick={() => onTabChange('reference')}
        className="flex flex-col items-center justify-center space-y-1 flex-1 min-w-0 text-white py-2 px-1 h-full transition-colors duration-200"
        style={{
          width: '33.333%',
          backgroundColor: activeTab === 'reference' ? '#3b82f6' : '#eab308'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'reference') {
            e.currentTarget.style.backgroundColor = '#facc15';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'reference') {
            e.currentTarget.style.backgroundColor = '#eab308';
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 2a2 2 0 00-2 2v12a2 2 0 002 2h8V2H8zm2 2h6v12h-6V4zM2 6v10a2 2 0 002 2h2V4H4a2 2 0 00-2 2z"/>
        </svg>
        <span className="text-xs font-bold uppercase">Reference</span>
      </button>
      
      <button
        onClick={() => onTabChange('battleForge')}
        className="flex flex-col items-center justify-center space-y-1 flex-1 min-w-0 text-white py-2 px-1 h-full transition-colors duration-200"
        style={{
          width: '33.333%',
          backgroundColor: activeTab === 'battleForge' ? '#3b82f6' : '#eab308'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'battleForge') {
            e.currentTarget.style.backgroundColor = '#facc15';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'battleForge') {
            e.currentTarget.style.backgroundColor = '#eab308';
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2l2.39 4.84 5.35.78-3.87 3.77.91 5.32L10 13.77l-4.78 2.52.91-5.32L2.26 7.62l5.35-.78L10 2z"/>
        </svg>
        <span className="text-xs font-bold uppercase">Battle Forge</span>
      </button>
      
      <button
        onClick={() => onTabChange('profile')}
        className="flex flex-col items-center justify-center space-y-1 flex-1 min-w-0 text-white py-2 px-1 h-full transition-colors duration-200"
        style={{
          width: '33.333%',
          backgroundColor: activeTab === 'profile' ? '#3b82f6' : '#eab308'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'profile') {
            e.currentTarget.style.backgroundColor = '#facc15';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'profile') {
            e.currentTarget.style.backgroundColor = '#eab308';
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a5 5 0 100 10 5 5 0 000-10zm-7 14a7 7 0 0114 0H3z" clipRule="evenodd"/>
        </svg>
        <span className="text-xs font-bold uppercase">Profile</span>
      </button>
    </nav>
  );
} 