"use client";
import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Settings from './pages/Settings';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'orders': return <Orders />;
      case 'analytics': return <Analytics />;
      case 'users': return user?.role === 'admin' ? <Users /> : <Dashboard />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={sidebarCollapsed}
        userRole={user?.role || 'customer'}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header 
          user={user}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content */}
        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}