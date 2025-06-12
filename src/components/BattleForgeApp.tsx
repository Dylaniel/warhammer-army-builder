'use client';

import { useState } from 'react';
import Header from './Header';
import ReferenceTab from './ReferenceTab';
import BattleForgeTab from './BattleForgeTab';
import ProfileTab from './ProfileTab';
import BottomNavigation from './BottomNavigation';

type TabType = 'reference' | 'battleForge' | 'profile';

export default function BattleForgeApp() {
  const [activeTab, setActiveTab] = useState<TabType>('battleForge');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'reference':
        return <ReferenceTab />;
      case 'battleForge':
        return <BattleForgeTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <BattleForgeTab />;
    }
  };

  return (
    <div className="bg-gray-900 text-white font-sans h-screen overflow-hidden relative" 
         style={{ background: "url('https://images.unsplash.com/photo-1549449416-563b711e5057?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60') center/cover no-repeat" }}>
      
      {/* Free Version Banner */}
      <div className="bg-yellow-500 text-gray-900 text-center py-2 px-4 text-sm font-semibold">
        You are currently using the free version of Battle Forge - you are limited to one army roster.
      </div>

      {/* App Bar */}
      <Header />

      {/* Main Content Area */}
      <main className="overflow-auto pb-32 pt-4 h-[calc(100vh-4rem)]">
        {renderActiveTab()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
} 