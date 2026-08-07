import React, { useEffect, useState } from 'react';
import './styles.css';
import { useAuthStore } from '../../store/authStore';

export default function M011Page() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'farmer' });
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users');
      const body = await res.json();
      if (body && body.success) setUsers(body.data.users || []);
      else setError(body.error || 'Failed to load');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form)
      });
      const body = await res.json();
      if (body && body.success) {
        setForm({ name: '', email: '', password: '', role: 'farmer' });
        load();
      } else {
        setError(body.error || 'Failed to create');
      }
    } catch (e) { setError(e.message); }
  }

  return (
    <div className='module-M011'>
      <h1>User Management (M011)</h1>
      <p>Domain: Identity — Status: PARTIAL</p>

      <section>
        <h2>Create user</h2>
        <form onSubmit={onCreate}>
          <input placeholder='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder='Email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder='Password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value='farmer'>farmer</option>
            <option value='fpo'>fpo</option>
            <option value='admin'>admin</option>
          </select>
          <button type='submit'>Create</button>
        </form>
        {error && <div className='text-red-600'>{error}</div>}
      </section>

      <section>
        <h2>Users</h2>
        {loading ? <div>Loading…</div> : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
