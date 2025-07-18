'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import ReferenceTab from './ReferenceTab';
import BattleForgeTab from './BattleForgeTab';
import ProfileTab from './ProfileTab';
import BottomNavigation from './BottomNavigation';
import { Army } from '../types/army';

type TabType = 'reference' | 'battleForge' | 'profile';

export default function BattleForgeApp() {
  const [activeTab, setActiveTab] = useState<TabType>('battleForge');
  const [armies, setArmies] = useState<Army[]>(() => {
    const stored = localStorage.getItem('armies');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('armies');
      }
    }
    return [];
  });

  // Save armies to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('armies', JSON.stringify(armies));
  }, [armies]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'reference':
        return <ReferenceTab />;
      case 'battleForge':
        return <BattleForgeTab armies={armies} setArmies={setArmies} />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <BattleForgeTab armies={armies} setArmies={setArmies} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div
        className="bg-gray-900 text-white font-sans"
        style={{
          width: '390px',
          height: '844px',
          borderRadius: '1.5rem',
          boxShadow: '0 0 0 1px #222',
          display: 'grid',
          gridTemplateRows: '20px 64px 623px 64px',
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
          className="bg-yellow-500 text-gray-900 text-center py-2 px-4 text-sm font-semibold flex items-center justify-center"
          style={{
            gridArea: 'banner',
            height: '10px',
            overflow: 'hidden',
          }}
        ></div>

        {/* App Bar - Row 2: Fixed height */}
        <div
          style={{
            gridArea: 'header',
            height: '64px',
          }}
        >
          <Header />
        </div>

        {/* Main Content Area - Row 3: Fixed height, scrollable */}
        <div
          style={{
            gridArea: 'content',
            position: 'relative',
            height: '623px',
            minHeight: 0,
            zIndex: 1,
          }}
        >
          <main className="pt-4 overflow-y-scroll absolute inset-0 h-[600px] w-full z-[1]">
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
