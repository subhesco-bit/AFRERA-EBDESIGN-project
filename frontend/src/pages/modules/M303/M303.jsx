/**
 * M303: Module Page
 * Auto-generated module interface with full CRUD
 */

import React, { useState, useEffect } from 'react';
import './M303.css';

export default function M303Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/backend-modules/M303/`);
      const result = await response.json();
      setData(result.items || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/v1/backend-modules/M303/${editId}` : `/api/v1/backend-modules/M303/`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        setForm({});
        setEditId(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this item?')) {
      try {
        await fetch(`/api/v1/backend-modules/M303/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditId(item.id);
  };

  return (
    <div className="module-page m303-page">
      <div className="module-container">
        <header className="module-header">
          <h1>M303: Module M303</h1>
          <p>Module Management Interface</p>
        </header>

        <div className="module-content">
          {/* Form */}
          <form onSubmit={handleSubmit} className="module-form">
            <h2>{editId ? 'Edit' : 'Create'} Item</h2>
            <input
              type="text"
              placeholder="Name"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button type="submit" className="btn-primary">
              {editId ? 'Update' : 'Create'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => { setForm({}); setEditId(null); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </form>

          {/* List */}
          <div className="module-list">
            <h2>Items ({data.length})</h2>
            {loading ? (
              <p className="loading">Loading...</p>
            ) : data.length === 0 ? (
              <p className="empty-state">No items yet</p>
            ) : (
              <div className="list-items">
                {data.map((item) => (
                  <div key={item.id} className="list-item">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="item-actions">
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
