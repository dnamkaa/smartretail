"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ProductsTest() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    stock: 0,
    description: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    try {
      await api.createProduct(newProduct);
      setNewProduct({ name: '', price: 0, stock: 0, description: '' });
      loadProducts(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteProduct(id: number) {
    try {
      await api.deleteProduct(id);
      loadProducts(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">🛍️ Products Test</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Product Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-3">Add New Product</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Stock"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={createProduct}
          className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Product
        </button>
      </div>

      {/* Products List */}
      <div>
        <h3 className="font-medium mb-3">Products ({products.length})</h3>
        {loading ? (
          <div>Loading products...</div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{product.name}</span>
                  <span className="text-gray-600 ml-2">${product.price}</span>
                  <span className="text-sm text-gray-500 ml-2">Stock: {product.stock}</span>
                </div>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-green-600">
        ✅ Product Service Connection: {products.length > 0 || !loading ? 'Working' : 'Testing...'}
      </div>
    </div>
  );
}