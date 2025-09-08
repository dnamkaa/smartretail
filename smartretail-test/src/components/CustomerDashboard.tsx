"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [productsData, ordersData] = await Promise.all([
        api.getProducts(),
        api.getMyOrders()
      ]);
      
      setProducts(productsData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(productId: number, quantity: number = 1) {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + quantity
    }));
  }

  function removeFromCart(productId: number) {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  }

  function updateCartQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  }

  async function placeOrder() {
    const items = Object.entries(cart).map(([productId, quantity]) => ({
      product_id: Number(productId),
      quantity
    }));

    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      await api.placeOrder(items);
      setCart({});
      setShowCart(false);
      loadData(); // Refresh orders and products
      alert('Order placed successfully!');
    } catch (error: any) {
      alert('Failed to place order: ' + error.message);
    }
  }

  async function cancelOrder(orderId: number) {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await api.cancelOrder(orderId);
        loadData(); // Refresh orders
        alert('Order cancelled successfully!');
      } catch (error: any) {
        alert('Failed to cancel order: ' + error.message);
      }
    }
  }

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === Number(productId));
    return product ? { ...product, cartQuantity: quantity } : null;
  }).filter(Boolean);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item!.price * item!.cartQuantity), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}! 👋
          </h2>
          <p className="text-gray-600">Explore our products and manage your orders</p>
        </div>
        
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🛒 Cart ({Object.keys(cart).length})
          {Object.keys(cart).length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {Object.values(cart).reduce((sum, qty) => sum + qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Cart</h3>
          {cartItems.length === 0 ? (
            <p className="text-gray-600">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item!.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{item!.name}</p>
                    <p className="text-sm text-gray-600">${item!.price} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      value={item!.cartQuantity}
                      onChange={(e) => updateCartQuantity(item!.id, Number(e.target.value))}
                      className="w-16 border rounded px-2 py-1 text-center"
                    />
                    <button
                      onClick={() => removeFromCart(item!.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <p className="text-lg font-bold">
                  Total: ${cartTotal.toFixed(2)}
                </p>
                <button
                  onClick={placeOrder}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Place Order
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Products</h3>
        {products.length === 0 ? (
          <p className="text-gray-600">No products available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 flex flex-col">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{product.name}</h4>
                  <p className="text-gray-600 mb-2">{product.description}</p>
                  <p className="text-lg font-semibold text-blue-700">${product.price}</p>
                  <p className={`text-sm mt-1 ${
                    product.stock === 0
                      ? 'text-red-600'
                      : product.stock < 10
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {product.stock === 0
                      ? 'Out of Stock'
                      : product.stock < 10
                      ? 'Low Stock'
                      : 'In Stock'}
                  </p>
                </div>
                <button
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                  className={`mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors ${
                    product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Your Orders</h3>
        {orders.length === 0 ? (
          <p className="text-gray-600">You have not placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.order_id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">Order #{order.order_id}</p>
                  <p className="text-sm text-gray-600">
                    {order.items?.length || 0} items • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                {order.status === 'pending' && (
                  <button
                    onClick={() => cancelOrder(order.order_id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}