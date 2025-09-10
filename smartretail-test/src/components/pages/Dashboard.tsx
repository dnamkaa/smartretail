"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [products, orders] = await Promise.all([
        api.getProducts(),
        user?.role === 'admin' ? api.getAllOrders() : api.getMyOrders()
      ]);

      const lowStock = products.filter((p: any) => p.stock < 10).length;
      const pending = orders.filter((o: any) => o.status === 'pending').length;

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: pending,
        lowStockProducts: lowStock
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.first_name}! Here's what's happening with your {isAdmin ? 'store' : 'account'}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdmin ? 'Total Products' : 'Available Products'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdmin ? 'Total Orders' : 'My Orders'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdmin ? 'Low Stock Alert' : 'Items in Cart'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {isAdmin ? stats.lowStockProducts : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-2xl mb-2 block">➕</span>
                <h3 className="font-medium">Add Product</h3>
                <p className="text-sm text-gray-600">Add new products to your inventory</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-2xl mb-2 block">📊</span>
                <h3 className="font-medium">View Analytics</h3>
                <p className="text-sm text-gray-600">Check sales and performance</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-2xl mb-2 block">👥</span>
                <h3 className="font-medium">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage user accounts</p>
              </button>
            </>
          ) : (
            <>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-2xl mb-2 block">🛍️</span>
                <h3 className="font-medium">Browse Products</h3>
                <p className="text-sm text-gray-600">Explore our product catalog</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-2xl mb-2 block">📋</span>
                <h3 className="font-medium">View Orders</h3>
                <p className="text-sm text-gray-600">Check your order history</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-2xl mb-2 block">⚙️</span>
                <h3 className="font-medium">Account Settings</h3>
                <p className="text-sm text-gray-600">Update your profile</p>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm">📦</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Products loaded successfully</p>
                <p className="text-xs text-gray-500">Found {stats.totalProducts} products in inventory</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm">📋</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Orders synced</p>
                <p className="text-xs text-gray-500">{stats.totalOrders} orders found, {stats.pendingOrders} pending</p>
              </div>
            </div>

            {isAdmin && stats.lowStockProducts > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Low stock alert</p>
                  <p className="text-xs text-yellow-600">{stats.lowStockProducts} products need restocking</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}