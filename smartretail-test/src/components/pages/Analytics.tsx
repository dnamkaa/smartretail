"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0] // today
  });

  // Data states
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any>(null);
  const [conversionFunnel, setConversionFunnel] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [stockStatus, setStockStatus] = useState<any>(null);
  const [salesReport, setSalesReport] = useState<any>(null);

  // Only allow admin users
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <span className="text-4xl mb-4 block">🚫</span>
          <h3 className="text-lg font-medium text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-600">You need admin privileges to access analytics.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  async function loadAnalyticsData() {
    try {
      setLoading(true);
      const [summaryData, topProductsData, funnelData, forecastData, stockData, reportData] = await Promise.all([
        api.getSalesSummary(dateRange.from, dateRange.to),
        api.getTopProducts(30, 10, 'revenue'),
        api.getConversionFunnel(dateRange.from, dateRange.to),
        api.getForecast(14),
        api.getStockStatus(5, 30),
        api.getSalesReport('day', dateRange.from, dateRange.to)
      ]);

      setSalesSummary(summaryData);
      setTopProducts(topProductsData);
      setConversionFunnel(funnelData);
      setForecast(forecastData);
      setStockStatus(stockData);
      setSalesReport(reportData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function rebuildForecast() {
    try {
      await api.rebuildForecast(14, 30);
      const forecastData = await api.getForecast(14);
      setForecast(forecastData);
      alert('Forecast rebuilt successfully!');
    } catch (error) {
      alert('Failed to rebuild forecast');
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'sales', name: 'Sales', icon: '💰' },
    { id: 'products', name: 'Products', icon: '📦' },
    { id: 'forecast', name: 'Forecast', icon: '🔮' },
    { id: 'inventory', name: 'Inventory', icon: '📋' },
    { id: 'reports', name: 'Reports', icon: '📄' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive business insights and reports</p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics data...</span>
        </div>
      ) : (
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ${salesSummary?.totals?.revenue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {salesSummary?.totals?.orders || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Items Sold</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {salesSummary?.totals?.items || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <span className="text-2xl">💵</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ${salesSummary?.totals?.orders > 0 
                          ? (salesSummary.totals.revenue / salesSummary.totals.orders).toFixed(2) 
                          : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Trend Chart */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesSummary?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {conversionFunnel?.funnel && Object.entries(conversionFunnel.funnel).map(([stage, count]) => (
                    <div key={stage} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{count as number}</p>
                      <p className="text-sm text-gray-600 capitalize">{stage}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Daily Sales Breakdown</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesSummary?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orders_count" fill="#3B82F6" name="Orders" />
                      <Bar dataKey="items_count" fill="#10B981" name="Items" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Volume */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Sales Volume Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesSummary?.daily || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="orders_count" stroke="#10B981" name="Orders" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue Distribution */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Revenue Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesSummary?.daily?.slice(-7) || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                          label={(entry) => `$${Number(entry.revenue).toFixed(0)}`}
                        >
                          {(salesSummary?.daily?.slice(-7) || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Top Products (30 days)</h3>
                  <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                    <option value="revenue">By Revenue</option>
                    <option value="quantity">By Quantity</option>
                  </select>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(topProducts?.top || []).map((product: any) => (
                        <tr key={product.product_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <span className="text-sm font-medium text-blue-600">#{product.rank}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                                📦
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                                <div className="text-sm text-gray-500">ID: {product.product_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${product.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Products Chart */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Top Products Revenue</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts?.top || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="product_name" type="category" width={100} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Tab */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Sales Forecast (Next 14 days)</h3>
                  <button
                    onClick={rebuildForecast}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Rebuild Forecast
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Model: {forecast?.forecast?.[0]?.model_name || 'N/A'} • 
                    Source: {forecast?.source || 'N/A'}
                  </p>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecast?.forecast || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Forecast']} />
                      <Line type="monotone" dataKey="yhat" stroke="#F59E0B" strokeWidth={2} name="Forecast" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Avg Daily Forecast</h4>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${forecast?.forecast?.length > 0 
                      ? (forecast.forecast.reduce((sum: number, day: any) => sum + day.yhat, 0) / forecast.forecast.length).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Total 14-Day Forecast</h4>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${forecast?.forecast?.reduce((sum: number, day: any) => sum + day.yhat, 0).toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Model Confidence</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {forecast?.source === 'table' ? 'High' : 'Basic'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Total Inventory Value</h4>
                  <p className="text-2xl font-bold text-green-600">
                    ${stockStatus?.inventory_value?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Low Stock Items</h4>
                  <p className="text-2xl font-bold text-red-600">
                    {stockStatus?.rows?.filter((item: any) => item.low_stock).length || 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Total Products</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {stockStatus?.rows?.length || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Stock Status</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold (30d)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(stockStatus?.rows || []).map((item: any) => (
                        <tr key={item.product_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.stock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.sold_last_window}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.reserved}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(item.stock * item.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.low_stock 
                                ? 'bg-red-100 text-red-800'
                                : item.stock < 20
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                                                            {item.low_stock ? 'Low Stock' : item.stock < 20 ? 'Medium' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Sales Reports</h3>
                  <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                      <option value="day">Daily</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                    </select>
                    <a
                      href={api.getSalesReportCSV('day', dateRange.from, dateRange.to)}
                      download
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      📊 Export CSV
                    </a>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(salesReport?.rows || []).map((row: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.period}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.orders}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.items}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${Number(row.revenue).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {salesReport?.totals && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-xl font-bold text-gray-900">{salesReport.totals.orders}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Items</p>
                        <p className="text-xl font-bold text-gray-900">{salesReport.totals.items}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-xl font-bold text-gray-900">${salesReport.totals.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Best Day</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {salesSummary?.daily?.reduce((best: any, day: any) => 
                          day.revenue > (best?.revenue || 0) ? day : best, null)?.day || 'N/A'}
                      </p>
                    </div>
                    <span className="text-2xl">📈</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Peak Revenue</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${salesSummary?.daily?.reduce((max: number, day: any) => 
                          Math.max(max, day.revenue), 0)?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <span className="text-2xl">💰</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                      <p className="text-lg font-semibold text-green-600">+12%</p>
                    </div>
                    <span className="text-2xl">📊</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {conversionFunnel?.funnel ? 
                          ((conversionFunnel.funnel.delivered / conversionFunnel.funnel.created) * 100).toFixed(1) + '%'
                          : 'N/A'}
                      </p>
                    </div>
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Export Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href={api.getSalesReportCSV('day', dateRange.from, dateRange.to)}
                    download
                    className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <p className="font-medium">Daily Sales CSV</p>
                      <p className="text-sm text-gray-600">Export daily breakdown</p>
                    </div>
                  </a>
                  
                  <a
                    href={api.getSalesReportCSV('week', dateRange.from, dateRange.to)}
                    download
                    className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-2xl mr-3">📅</span>
                    <div>
                      <p className="font-medium">Weekly Sales CSV</p>
                      <p className="text-sm text-gray-600">Export weekly breakdown</p>
                    </div>
                  </a>
                  
                  <a
                    href={api.getSalesReportCSV('month', dateRange.from, dateRange.to)}
                    download
                    className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-2xl mr-3">🗓️</span>
                    <div>
                      <p className="font-medium">Monthly Sales CSV</p>
                      <p className="text-sm text-gray-600">Export monthly breakdown</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}