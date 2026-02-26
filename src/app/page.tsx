'use client';

import { useState, useEffect } from 'react';
import BottomNav, { type TabName } from '@/components/BottomNav';
import Dashboard from '@/components/Dashboard';
import POS from '@/components/POS';
import Inventory from '@/components/Inventory';
import Finance from '@/components/Finance';
import PinLock from '@/components/PinLock';
import DemoReset from '@/components/DemoReset';
import { useStore } from '@/lib/store';

const IS_SUPABASE = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';
const IS_LOCAL = !IS_SUPABASE;

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const initialize = useStore((s) => s.initialize);
  const isLoading = useStore((s) => s.isLoading);

  // Supabase mode: init data on mount
  useEffect(() => {
    if (IS_SUPABASE && initialize) {
      initialize();
    }
  }, [initialize]);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'pos': return <POS />;
      case 'inventory': return <Inventory />;
      case 'finance': return <Finance />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  if (IS_SUPABASE && isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Memuat data toko…</p>
      </div>
    );
  }

  return (
    <main>
      {renderPage()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {/* Tombol reset hanya muncul di versi demo */}
      {IS_LOCAL && <DemoReset />}
    </main>
  );
}

export default function Home() {
  // PinLock aktif di semua mode (Supabase & demo/lokal)
  return (
    <PinLock>
      <AppContent />
    </PinLock>
  );
}
