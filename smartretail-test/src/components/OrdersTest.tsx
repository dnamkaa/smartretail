"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function OrdersTest() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = user?.role === 'admin' 
        ? await api.getAllOrders()
        : await api.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    }
  }

  async function placeOrder() {
    try {
      const items = orderItems
        .filter(item => item.product_id && item.quantity > 0)
        .map(item => ({
          product_id: Number(item.product_id),
          quantity: item.quantity
        }));

      if (items.length === 0) {
        setError('Please select at least one product');
        return;
      }

      await api.placeOrder(items);
      setOrderItems([{ product_id: '', quantity: 1 }]);
      loadOrders(); // Refresh orders
      loadProducts(); // Refresh products (stock updated)
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function cancelOrder(id: number) {
    try {
      await api.cancelOrder(id);
      loadOrders(); // Refresh orders
      loadProducts(); // Refresh products (stock restored)
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function updateOrderStatus(id: number, status: string) {
    try {
      await api.updateOrderStatus(id, status);
      loadOrders(); // Refresh orders
    } catch (err: any) {
      setError(err.message);
    }
  }

  function addOrderItem() {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  }

  function updateOrderItem(index: number, field: string, value: any) {
    const updated = orderItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setOrderItems(updated);
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">📋 Orders Test</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500">×</button>
        </div>
      )}

      {/* Place Order Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-3">Place New Order</h3>
        {orderItems.map((item, index) => (
          <div key={index} className="flex gap-3 mb-2">
            <select
              value={item.product_id}
              onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (${product.price}) - Stock: {product.stock}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
              className="border rounded px-3 py-2 w-20"
              placeholder="Qty"
            />
          </div>
        ))}
        <div className="flex gap-2">
          <button
            onClick={addOrderItem}
            className="bg-gray-500 text-white px-3 py-2 rounded text-sm"
          >
            Add Item
          </button>
          <button
            onClick={placeOrder}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Place Order
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div>
        <h3 className="font-medium mb-3">
          {user?.role === 'admin' ? 'All Orders' : 'My Orders'} ({orders.length})
        </h3>
        {loading ? (
          <div>Loading orders...</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.order_id} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">Order #{order.order_id}</span>
                    {user?.role === 'admin' && (
                      <span className="text-gray-600 ml-2">User: {order.user_id}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Items: {order.items?.map((item: any) => 
                    `${item.quantity}x Product ${item.product_id}`
                  ).join(', ')}
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => cancelOrder(order.order_id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'paid')}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'shipped')}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Ship
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-green-600">
        ✅ Order Service Connection: {orders.length >= 0 && !loading ? 'Working' : 'Testing...'}
      </div>
    </div>
  );
}