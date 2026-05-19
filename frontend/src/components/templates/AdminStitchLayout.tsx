import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../organisms/AdminSidebar';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { AdminTopBar } from '../organisms/AdminTopBar';

export function AdminStitchLayout() {
  const { logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AdminSidebar />
      <AdminTopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="ml-sidebar-width mt-navbar-height p-container-margin min-h-[calc(100vh-72px)]">
        <Outlet context={{ searchQuery, logout }} />
      </main>
    </div>
  );
}
