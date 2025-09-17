"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api'; // ✅ Fixed import

interface Payment {
  id: number;
  order_id: number;
  amount: number;
  provider: string;
  channel: string;
  status: string;
  payment_ref: string;
  created_at: string;
  meta?: any;
  receipt?: {
    method: string;
    reference: string;
    attachment_url?: string;
  };
}

interface PaymentStats {
  total: number;
  success: number;
  pending: number;
  failed: number;
  revenue: number;
  today: {
    payments: number;
    revenue: number;
  };
}

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showNewOfflinePayment, setShowNewOfflinePayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new offline payment
  const [newPaymentForm, setNewPaymentForm] = useState({
    order_id: '',
    method: 'bank_transfer',
    reference: '',
    amount: '',
    attachment_file: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    await Promise.all([
      fetchPayments(),
      user?.role === 'admin' ? fetchStats() : null
    ]);
  };

  const fetchPayments = async () => {
    try {
      setError(null);
      let data;
      
      if (user?.role === 'admin') {
        data = await api.getAllPayments(1, undefined, 'offline'); // ✅ Changed to api
      } else if (user?.id) {
        data = await api.getUserPayments(user.id); // ✅ Changed to api
      } else {
        throw new Error('User not authenticated');
      }
      
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load payments');
      
      // Fallback to mock data for development
      setPayments([
        {
          id: 1,
          order_id: 1001,
          amount: 299.99,
          provider: 'offline',
          channel: 'offline',
          status: 'awaiting_verification',
          payment_ref: 'OFF_abc123def',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          meta: {
            events: [
              { type: 'offline_submit', ts: new Date(Date.now() - 86400000).toISOString() }
            ]
          },
          receipt: {
            method: 'bank_transfer',
            reference: 'TXN123456789',
            attachment_url: '/receipts/receipt_1.pdf'
          }
        },
        {
          id: 2,
          order_id: 1002,
          amount: 149.50,
          provider: 'offline',
          channel: 'offline',
          status: 'success',
          payment_ref: 'OFF_xyz789abc',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          meta: {
            events: [
              { type: 'offline_submit', ts: new Date(Date.now() - 172800000).toISOString() },
              { type: 'offline_verify', ts: new Date(Date.now() - 86400000).toISOString(), approved: true }
            ]
          },
          receipt: {
            method: 'cash',
            reference: 'CASH001'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getPaymentStats(); // ✅ Changed to api
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
    }
  };

  const handleSubmitOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('order_id', newPaymentForm.order_id);
      formData.append('method', newPaymentForm.method);
      formData.append('reference', newPaymentForm.reference);
      formData.append('amount', newPaymentForm.amount);
      
      if (newPaymentForm.attachment_file) {
        formData.append('attachment', newPaymentForm.attachment_file);
      }

      const result = await api.submitOfflinePayment(formData); // ✅ Changed to api
      
      alert(`✅ Payment submitted successfully!\n\nPayment ID: ${result.payment_id}\nReference: ${result.payment_ref}\n\nStatus: ${result.status}`);
      
      setShowNewOfflinePayment(false);
      setNewPaymentForm({
        order_id: '',
        method: 'bank_transfer',
        reference: '',
        amount: '',
        attachment_file: null,
      });
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Failed to submit offline payment:', error);
      alert('❌ Failed to submit payment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number, approved: boolean) => {
    try {
      const result = await api.verifyPayment(paymentId, approved); // ✅ Changed to api
      
      alert(
        approved 
          ? `✅ Payment approved successfully!\n\nPayment ID: ${result.payment_id}\nStatus: ${result.status}\n${result.order_status ? `Order Status: ${result.order_status}` : ''}`
          : `❌ Payment rejected.\n\nPayment ID: ${result.payment_id}\nStatus: ${result.status}`
      );
      
      fetchData();
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to verify payment:', error);
      alert('❌ Failed to verify payment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // ... rest of your helper functions stay exactly the same ...
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'awaiting_verification': return '⏳';
      default: return '⏸️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200';
      case 'awaiting_verification': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return '🏦';
      case 'cash': return '💵';
      default: return '📄';
    }
  };

  const getMethodFromPayment = (payment: Payment) => {
    return payment.receipt?.method || 
           payment.meta?.events?.find((e: any) => e.type === 'offline_submit')?.method || 
           'unknown';
  };

  const getReferenceFromPayment = (payment: Payment) => {
    return payment.receipt?.reference || 
           payment.meta?.events?.find((e: any) => e.type === 'offline_submit')?.reference || 
           'N/A';
  };

    const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.payment_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.order_id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    let matchesMethod = true;
    if (methodFilter !== 'all') {
      const method = getMethodFromPayment(payment);
      matchesMethod = method === methodFilter;
    }
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <span className="text-gray-600">Loading payments...</span>
        {error && (
          <p className="text-red-500 text-sm mt-2">Attempting to connect to payment service...</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <span className="text-yellow-500 text-xl mr-2">⚠️</span>
            <div>
              <p className="text-yellow-800 font-medium">Payment Service Connection</p>
              <p className="text-yellow-600 text-sm">
                Using demo data. Make sure payment service is running on port 5003.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Payment Management' : 'My Payments'}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'admin' 
              ? 'Review and verify offline payment submissions' 
              : 'Submit and track your offline payments'
            }
          </p>
        </div>
        
        {user?.role !== 'admin' && (
          <button
            onClick={() => setShowNewOfflinePayment(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            disabled={submitting}
          >
            <span className="mr-2">➕</span>
            Submit Payment
          </button>
        )}
      </div>

      {/* Stats Cards - Admin Only */}
      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <span className="text-xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <span className="text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <span className="text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <span className="text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of your existing JSX - filters, payments list, modals, etc. */}
      {/* Just keep everything else exactly as you had it */}
      {/* I'm cutting it short here since it's the same as what you already have */}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by payment ref or order ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="awaiting_verification">Awaiting Verification</option>
            <option value="success">Verified</option>
            <option value="failed">Rejected</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Keep all your existing JSX for payments list, empty state, modals, etc. */}
      {/* I'm not repeating it all since you already have it perfect */}
      
    </div>
  );
}