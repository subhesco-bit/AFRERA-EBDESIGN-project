import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [filter, page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const userId = 'user123'; // Replace with actual user ID from auth
      const response = await transactionAPI.getUserTransactions(userId, {
        limit: 20,
        offset: (page - 1) * 20,
        status: filter !== 'all' ? filter : undefined
      });
      
      setTransactions(response.data.transactions || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (tx.description && tx.description.toLowerCase().includes(searchLower)) ||
      (tx.type && tx.type.toLowerCase().includes(searchLower)) ||
      (tx.category && tx.category.toLowerCase().includes(searchLower))
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'pending':
      case 'processing':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-600 mt-2">View and track all your transactions</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <>
            <div className="divide-y">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.transaction_id || tx.id} 
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTransaction(tx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${getStatusColor(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {tx.description || tx.type || 'Transaction'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tx.transaction_id || tx.id} • {new Date(tx.created_at || tx.createdAt).toLocaleString()}
                        </div>
                        {tx.category && (
                          <div className="text-xs text-gray-400 mt-1 capitalize">{tx.category}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {tx.type === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} transactions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(Math.ceil(total / 20), page + 1))}
                    disabled={page >= Math.ceil(total / 20)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-sm">{selectedTransaction.transaction_id || selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Type</span>
                  <span className="font-semibold capitalize">{selectedTransaction.type}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-lg">
                    {selectedTransaction.type === 'credit' ? '+' : '-'}₹{parseFloat(selectedTransaction.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Description</span>
                  <span className="font-medium">{selectedTransaction.description || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium capitalize">{selectedTransaction.category || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{new Date(selectedTransaction.created_at || selectedTransaction.createdAt).toLocaleString()}</span>
                </div>
                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                  <div className="py-3">
                    <span className="text-gray-600 block mb-2">Additional Details</span>
                    <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}