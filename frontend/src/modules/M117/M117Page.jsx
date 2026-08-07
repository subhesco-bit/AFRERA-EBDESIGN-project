import React, { useEffect, useState } from 'react';
import './styles.css';

export default function M117Page(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(()=>{ setLoading(true); fetch(/api/v1/).then(r=>r.json()).then(b=>{ if(b.success) setItems(b.data.items||[]); setLoading(false); }).catch(()=>setLoading(false)); }, []);
  return (<div className='module-M117 p-4'>
    <h1>M117 Module</h1>
    {loading? <div>Loading…</div> : (
      <ul>{items.map(it => <li key={it.id}>{JSON.stringify(it.data)}</li>)}</ul>
    )}
  </div>);
}