"use client";
import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';

export default function LoginForm() {
  const { login, register, error } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            S
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartRetail</h1>
          <p className="text-gray-600">Welcome! Please sign in to continue.</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              isLoginMode 
                ? "bg-white text-blue-600 shadow-sm font-medium" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              !isLoginMode 
                ? "bg-white text-blue-600 shadow-sm font-medium" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Last Name (Optional)"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-colors"
          >
            {isLoginMode ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            SmartRetail Dashboard • Auth + Products + Orders
          </p>
        </div>
      </div>
    </div>
  );
}