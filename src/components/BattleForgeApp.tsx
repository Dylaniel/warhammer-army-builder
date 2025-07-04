'use client';

import { useState } from 'react';
import Header from './Header';
import ReferenceTab from './ReferenceTab';
import BattleForgeTab from './BattleForgeTab';
import ProfileTab from './ProfileTab';
import BottomNavigation from './BottomNavigation';
import { Army } from '../types/army';

type TabType = 'reference' | 'battleForge' | 'profile';

export default function BattleForgeApp() {
  const [activeTab, setActiveTab] = useState<TabType>('battleForge');
  const [armies, setArmies] = useState<Army[]>([]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'reference':
        return <ReferenceTab armies={armies} />;
      case 'battleForge':
        return <BattleForgeTab armies={armies} setArmies={setArmies} />;
      case 'profile':
        return <ProfileTab armies={armies} />;
      default:
        return <BattleForgeTab armies={armies} setArmies={setArmies} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div
        className="bg-gray-900 text-white font-sans overflow-hidden"
        style={{
          width: '390px',
          height: '844px',
          borderRadius: '1.5rem',
          boxShadow: '0 0 0 1px #222',
          background:
            "url('https://images.unsplash.com/photo-1549449416-563b711e5057?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60') center/cover no-repeat",
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
        >
          
        </div>

        {/* App Bar - Row 2: Fixed height */}
        <div
          style={{
            gridArea: 'header',
            height: '64px',
          }}
        >
          <Header />
        </div>

        {/* Main Content Area - Row 3: Flexible height, scrollable */}
        <main
          className="overflow-auto pt-4"
          style={{
            gridArea: 'content',
            minHeight: 0, // Important for grid items to allow scrolling
          }}
        >
          {renderActiveTab()}
        </main>

        {/* Bottom Navigation - Row 4: Fixed height, anchored to bottom */}
        <div
          style={{
            gridArea: 'navigation',
            height: '64px',
          }}
        >
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
