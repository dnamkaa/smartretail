"use client";
import { useAuth } from '@/providers/auth-provider';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  collapsed: boolean;
  userRole: string;
}

export default function Sidebar({ currentPage, setCurrentPage, collapsed, userRole }: SidebarProps) {
  const { logout } = useAuth();

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'payments', label: 'Payments', icon: '💳' }, // Added payments
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const customerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'products', label: 'Shop', icon: '🛍️' },
    { id: 'orders', label: 'My Orders', icon: '📋' },
    { id: 'payments', label: 'My Payments', icon: '💳' }, // Added payments for customers
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : customerNavItems;

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          {!collapsed && (
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">SmartRetail</h2>
              <p className="text-xs text-gray-500">
                {userRole === 'admin' ? 'Admin Panel' : 'Customer Portal'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span className="ml-3 text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <span className="text-lg">🚪</span>
          {!collapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}