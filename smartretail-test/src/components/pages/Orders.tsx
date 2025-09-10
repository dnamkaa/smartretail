"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

interface OrderWithDetails extends Order {
  itemsWithDetails?: OrderItemWithDetails[];
  totalAmount?: number;
}

interface OrderItemWithDetails {
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
  product_description?: string;
  total: number;
}

interface Order {
  order_id: number;
  user_id: number;
  status: string;
  created_at: string;
  items: any[];
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadOrdersAndProducts();
  }, []);

  async function loadOrdersAndProducts() {
    try {
      // Load both orders and products in parallel
      const [ordersData, productsData] = await Promise.all([
        isAdmin ? api.getAllOrders() : api.getMyOrders(),
        api.getProducts()
      ]);

      setProducts(productsData);
      
      // Enhance orders with product details
      const ordersWithDetails = ordersData.map((order: Order) => ({
        ...order,
        itemsWithDetails: order.items?.map(item => {
          const product = productsData.find(p => p.id === item.product_id);
          return {
            ...item,
            product_name: product?.name || `Unknown Product`,
            product_description: product?.description || 'No description available',
            total: item.price * item.quantity
          };
        }) || [],
        totalAmount: order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
      }));

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Failed to load orders and products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: number, status: string) {
    try {
      await api.updateOrderStatus(orderId, status);
      loadOrdersAndProducts(); // Reload to refresh data
    } catch (error: any) {
      alert('Failed to update order: ' + error.message);
    }
  }

  async function cancelOrder(orderId: number) {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await api.cancelOrder(orderId);
        loadOrdersAndProducts(); // Reload to refresh data
      } catch (error: any) {
        alert('Failed to cancel order: ' + error.message);
      }
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'paid': return '💰';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Orders Management' : 'My Orders'}
        </h1>
        <p className="text-gray-600">
          {isAdmin ? 'Manage customer orders' : 'Track your order history'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl font-semibold">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⏳</span>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-semibold">{orders.filter(o => o.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-xl font-semibold">{orders.filter(o => o.status === 'delivered').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-semibold">
                ${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({orders.filter(o => status === 'all' || o.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <span className="text-4xl mb-4 block">📋</span>
              <p className="text-gray-600">
                {filter === 'all' ? 'No orders found.' : `No ${filter} orders found.`}
              </p>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="mb-2 md:mb-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_id}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      <span className="mr-1">{getStatusIcon(order.status)}</span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  {isAdmin && (
                    <p className="text-sm text-gray-600 mt-1">Customer ID: {order.user_id}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Ordered: {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${order.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.itemsWithDetails?.length || 0} item(s)
                  </p>
                </div>
              </div>

              {/* Order Items with Product Details */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items:</h4>
                <div className="space-y-3">
                  {order.itemsWithDetails?.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                      {/* Product Icon */}
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📦</span>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.product_description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">
                            Qty: {item.quantity} × ${item.price}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            ${item.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Total: ${order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Customer Actions */}
                  {!isAdmin && order.status === 'pending' && (
                    <button
                      onClick={() => cancelOrder(order.order_id)}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'paid')}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          💰 Mark Paid
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'shipped')}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          🚚 Ship Order
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✅ Mark Delivered
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'paid') && (
                        <button
                          onClick={() => cancelOrder(order.order_id)}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          ❌ Cancel
                        </button>
                      )}
                    </div>
                  )}

                  {/* View Details Button */}
                  <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}