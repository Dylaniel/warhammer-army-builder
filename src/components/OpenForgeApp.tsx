'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import ReferenceTab from './ReferenceTab';
import OpenForgeTab from './OpenForgeTab';
import ProfileTab from './ProfileTab';
import BottomNavigation from './BottomNavigation';
import { Army } from '../types/army';
import { useTheme } from './ThemeContext';

type TabType = 'reference' | 'openForge' | 'profile';

export default function OpenForgeApp() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('openForge');
  const [armies, setArmies] = useState<Army[]>([]);

  // Load armies from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('armies');
      if (stored) {
        try {
          setArmies(JSON.parse(stored));
        } catch {
          localStorage.removeItem('armies');
        }
      }
    }
  }, []);

  // Save armies to localStorage whenever it changes. Wrapped in try/catch:
  // `setItem` can throw (e.g. `QuotaExceededError` from an oversized import,
  // or a browser blocking storage entirely) and an uncaught throw inside a
  // render-triggered effect crashes the whole React tree. Persistence
  // failing should never stop the user from continuing to work in-memory.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('armies', JSON.stringify(armies));
      } catch (error) {
        console.error('Failed to save armies to localStorage:', error);
      }
    }
  }, [armies]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'reference':
        return <ReferenceTab />;
      case 'openForge':
        return <OpenForgeTab armies={armies} setArmies={setArmies} />;
      case 'profile':
        return <ProfileTab armies={armies} setArmies={setArmies} />;
      default:
        return <OpenForgeTab armies={armies} setArmies={setArmies} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f5dc]">
      {' '}
      {/* Always beige */}
      <div
        className={`font-sans w-[390px] h-[844px] shadow-lg grid overflow-hidden ${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-white'}`}
        style={{
          borderRadius: '1.5rem',
          boxShadow: '0 0 0 1px #222',
          display: 'grid',
          gridTemplateRows: '20px 40px 1fr 64px',
          gridTemplateAreas: `
            "banner"
            "header"
            "content"
            "navigation"
          `,
        }}
      >
        {/* Spacer Banner - Row 1: Fixed height */}
        <div
          className="bg-yellow-500 text-gray-900 flex items-center justify-center"
          style={{
            gridArea: 'banner',
          }}
        ></div>

        {/* App Bar - Row 2: Fixed height */}
        <div
          style={{
            gridArea: 'header',
            height: '40px',
          }}
        >
          <Header />
        </div>

        {/* Main Content Area - Row 3: Fixed height, scrollable */}
        <div
          style={{
            gridArea: 'content',
            position: 'relative',
            minHeight: 0,
            zIndex: 1,
          }}
        >
          <main className="no-scrollbar overflow-y-auto absolute inset-0 h-full w-full z-[1]">
            {renderActiveTab()}
          </main>
        </div>

        {/* Bottom Navigation - Row 4: Fixed height, anchored to bottom */}
        <div
          style={{
            gridArea: 'navigation',
            height: '64px',
            zIndex: 2,
          }}
        >
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
