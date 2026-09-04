import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

export const PageContainer: React.FC = () => (
  <div className="min-h-screen" style={{ background: '#020617', color: '#F8FAFC' }}>
    <Sidebar />
    <div className="ml-60 flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);
