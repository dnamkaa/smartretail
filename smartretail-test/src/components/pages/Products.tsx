"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [showCart, setShowCart] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    stock: 0,
    description: '',
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    if (!newProduct.name || newProduct.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await api.createProduct(newProduct);
      setNewProduct({ name: '', price: 0, stock: 0, description: '' });
      setShowAddForm(false);
      loadProducts();
    } catch (error: any) {
      alert('Failed to create product: ' + error.message);
    }
  }

  async function deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (error: any) {
        alert('Failed to delete product: ' + error.message);
      }
    }
  }

  function addToCart(productId: number, quantity: number = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentCartQty = cart[productId] || 0;
    const newQty = currentCartQty + quantity;

    if (newQty > product.stock) {
      alert(`Cannot add ${newQty} items. Only ${product.stock} in stock!`);
      return;
    }

    setCart(prev => ({
      ...prev,
      [productId]: newQty
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
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      removeFromCart(productId);
    } else if (quantity > product.stock) {
      alert(`Only ${product.stock} items available in stock!`);
    } else {
      setCart(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  }

  async function placeOrderFromCart() {
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
      loadProducts(); // Refresh to show updated stock
      alert('Order placed successfully! 🎉');
    } catch (error: any) {
      alert('Failed to place order: ' + error.message);
    }
  }

  async function quickOrder(productId: number, quantity: number = 1) {
    try {
      await api.placeOrder([{ product_id: productId, quantity }]);
      loadProducts(); // Refresh to show updated stock
      alert('Order placed successfully! 🎉');
    } catch (error: any) {
      alert('Failed to place order: ' + error.message);
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === Number(productId));
    return product ? { ...product, cartQuantity: quantity } : null;
  }).filter(Boolean);

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item!.price * item!.cartQuantity), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Products Management' : 'Shop Products'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Manage your product inventory' : 'Browse and shop our products'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          {!isAdmin && (
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              🛒 Cart ({cartItemsCount})
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          )}
          
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ New Product'}
            </button>
          )}
        </div>
      </div>

      {/* Cart Modal */}
      {!isAdmin && showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🛒</span>
                <p className="text-gray-600">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item!.id} className="flex items-center justify-between py-3 border-b">
                    <div className="flex-1">
                      <h4 className="font-medium">{item!.name}</h4>
                      <p className="text-sm text-gray-600">${item!.price} each</p>
                      <p className="text-xs text-gray-500">Stock: {item!.stock}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQuantity(item!.id, item!.cartQuantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item!.cartQuantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item!.id, item!.cartQuantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item!.id)}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total: ${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCart(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={placeOrderFromCart}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex space-x-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Clothing</option>
              <option>Accessories</option>
            </select>
            
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Sort by</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Product Form */}
      {isAdmin && showAddForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Price *"
              min="0"
              step="0.01"
              value={newProduct.price || ''}
              onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              min="0"
              value={newProduct.stock || ''}
              onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={createProduct}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Product
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Grid/Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📦</span>
            <p className="text-gray-600">
              {searchTerm ? 'No products found matching your search.' : 'No products available.'}
            </p>
          </div>
        ) : isAdmin ? (
          /* Admin Table View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          📦
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock === 0 
                          ? 'bg-red-100 text-red-800'
                          : product.stock < 10 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">Edit</button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
                  
          /* Customer Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={cart[product.id] || 0}
                onAddToCart={addToCart}
                onQuickOrder={quickOrder}
                onUpdateCartQuantity={updateCartQuantity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate Product Card Component for better organization
function ProductCard({ 
  product, 
  cartQuantity, 
  onAddToCart, 
  onQuickOrder, 
  onUpdateCartQuantity 
}: {
  product: any;
  cartQuantity: number;
  onAddToCart: (id: number, quantity: number) => void;
  onQuickOrder: (id: number, quantity: number) => void;
  onUpdateCartQuantity: (id: number, quantity: number) => void;
}) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);

  const maxQuantity = Math.min(product.stock, 10); // Limit selector to 10 or stock amount

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
      {/* Product Image */}
      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
        <span className="text-4xl">📦</span>
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
            Low Stock
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
        {cartQuantity > 0 && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {cartQuantity} in cart
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description || 'No description available'}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-gray-900">${product.price}</span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>

        {/* Quantity Selector */}
        {product.stock > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                disabled={selectedQuantity <= 1}
              >
                -
              </button>
              <select
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: maxQuantity }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <button
                onClick={() => setSelectedQuantity(Math.min(maxQuantity, selectedQuantity + 1))}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                disabled={selectedQuantity >= maxQuantity}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            disabled={product.stock === 0}
            onClick={() => onAddToCart(product.id, selectedQuantity)}
            className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
              product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {product.stock === 0 ? 'Out of Stock' : `Add ${selectedQuantity} to Cart`}
          </button>
          
          {product.stock > 0 && (
            <button
              onClick={() => onQuickOrder(product.id, selectedQuantity)}
              className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Buy Now (${(product.price * selectedQuantity).toFixed(2)})
            </button>
          )}
        </div>

        {/* Cart Management (if item is in cart) */}
        {cartQuantity > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">In Cart: {cartQuantity}</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onUpdateCartQuantity(product.id, cartQuantity - 1)}
                  className="w-6 h-6 flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded"
                >
                  -
                </button>
                <span className="text-sm font-medium px-2">{cartQuantity}</span>
                <button
                  onClick={() => onUpdateCartQuantity(product.id, cartQuantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded"
                  disabled={cartQuantity >= product.stock}
                >
                  +
                </button>
                <button
                  onClick={() => onUpdateCartQuantity(product.id, 0)}
                  className="ml-2 text-xs text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}