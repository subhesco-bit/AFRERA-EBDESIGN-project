import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import './${className}.css';

export default function M231Page() {
  const { user } = useStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Fetch data
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        user_id: user?.id,
      });

      const response = await fetch(`/api/m231?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const result = await response.json();
      setData(result.data || []);
      setPagination(result.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.limit]);

  // Search
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/m231/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Create/Update
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/m231/${editingId}` : `/api/m231`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, ...formData }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setFormData({});
      setEditingId(null);
      fetchData(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [editingId, formData, user, fetchData]);

  // Delete
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this record?')) return;

    try {
      const response = await fetch(`/api/m231/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      fetchData(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  }, [pagination.page, fetchData]);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      fetchData(1);
    }
  }, [user, fetchData]);

  return (
    <div className="${serviceName}-container">
      <h1>M231</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>Search</button>
      </form>

      {/* Create/Edit Form */}
      <form onSubmit={handleSubmit} className="create-form">
        <h2>{editingId ? 'Edit' : 'Create New'}</h2>
        <input
          type="text"
          placeholder="Enter data..."
          value={JSON.stringify(formData)}
          onChange={(e) => {
            try {
              setFormData(JSON.parse(e.target.value));
            } catch {}
          }}
        />
        <button type="submit" disabled={loading}>
          {editingId ? 'Update' : 'Create'}
        </button>
        {editingId && (
          <button type="button" onClick={() => setEditingId(null)}>
            Cancel
          </button>
        )}
      </form>

      {/* Data List */}
      {loading && <p>Loading...</p>}
      {!loading && data.length === 0 && <p>No records found</p>}
      {!loading && data.length > 0 && (
        <div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => { setEditingId(item.id); setFormData(item); }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => fetchData(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button
              onClick={() => fetchData(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}