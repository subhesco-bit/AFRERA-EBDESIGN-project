import React, { useState } from 'react';
import api from '../../services/api';
import './styles.css';
export default function M016Page() {
  const [userId, setUserId] = useState(''); const [identities, setIdentities] = useState([]); const [provider, setProvider] = useState(''); const [providerUserId, setProviderUserId] = useState(''); const [message, setMessage] = useState('');
  const load = async () => { try { const response = await api.get(`/modules/m016/identities/${userId}`); setIdentities(response.data?.data || []); setMessage(''); } catch (error) { setMessage(error.response?.data?.error?.message || 'Unable to load identities'); } };
  const add = async () => { try { await api.post('/modules/m016/identities', { userId, provider, providerUserId, attributes: {} }); setMessage('Identity saved'); load(); } catch (error) { setMessage(error.response?.data?.error?.message || 'Unable to save identity'); } };
  return (
    <div className='module-M016'><header><p className='eyebrow'>M016 / Identity federation</p><h1>Single Sign-On</h1><p>Review federated identities and register trusted provider mappings.</p></header><section className='m016-panel'><label>User UUID<input value={userId} onChange={e => setUserId(e.target.value)} placeholder='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' /></label><button onClick={load}>Load identities</button><div className='m016-form'><label>Provider<input value={provider} onChange={e => setProvider(e.target.value)} /></label><label>Provider user ID<input value={providerUserId} onChange={e => setProviderUserId(e.target.value)} /></label><button onClick={add}>Add identity</button></div>{message && <p role='status'>{message}</p>}</section><section className='m016-list'><h2>Federated identities</h2>{identities.length ? identities.map(identity => <article key={identity.id}><strong>{identity.provider}</strong><span>{identity.provider_user_id}</span><small>{identity.trust_level}</small></article>) : <p>No identities loaded.</p>}</section>
    </div>
  );
}
