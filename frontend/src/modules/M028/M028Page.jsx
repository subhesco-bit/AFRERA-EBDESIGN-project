import React, { useEffect, useState } from 'react';
import { moduleCrudAPI } from '../../services/api';
import './styles.css';

export default function M028Page() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setLoading(true); moduleCrudAPI.list('M028').then(({ data }) => setItems(data?.data?.items || data?.data || [])).catch(() => setError('Unable to load module records')).finally(() => setLoading(false)); }, []);
  return (<div className='module-M028 p-4'>
    <h1>M028 Module</h1>
    {loading ? <div>Loading…</div> : error ? <div>{error}</div> : (
      <ul>{items.map(it => <li key={it.id}>{JSON.stringify(it.data)}</li>)}</ul>
    )}
  </div>);
}
