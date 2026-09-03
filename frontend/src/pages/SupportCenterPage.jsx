/**
 * Support Center Page
 * Help desk and customer support
 */

import { useState } from 'react';
import { Headphones, Send } from 'lucide-react';
import { formsAPI } from '../services/api';

export default function SupportCenterPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState({ submitting: false, error: '', success: '' });

  const submit = async (event) => {
    event.preventDefault();
    setState({ submitting: true, error: '', success: '' });
    try {
      const created = await formsAPI.createForm({ name: 'Support request', description: 'Support request form' });
      const formId = created?.data?.id || created?.data?.form?.id || created?.id;
      if (!formId) throw new Error('The forms service did not return a form identifier.');
      await formsAPI.submitForm(formId, form);
      setForm({ name: '', email: '', message: '' });
      setState({ submitting: false, error: '', success: 'Your request was submitted through the forms service.' });
    } catch (error) {
      setState({ submitting: false, error: error.response?.data?.error || error.message || 'Support request could not be submitted.', success: '' });
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6"><header className="flex items-start gap-3"><Headphones className="mt-1 text-emerald-700" aria-hidden="true" /><div><h1 className="text-3xl font-semibold text-slate-950">Support Center</h1><p className="mt-2 text-sm text-slate-600">Send a support request through the verified forms service.</p></div></header>
      <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">There is no dedicated ticket API client. Your request is submitted as a form response.</p>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div><label htmlFor="support-name" className="block text-sm font-medium text-slate-700">Name</label><input id="support-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div><div><label htmlFor="support-email" className="block text-sm font-medium text-slate-700">Email</label><input id="support-email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div><div><label htmlFor="support-message" className="block text-sm font-medium text-slate-700">How can we help?</label><textarea id="support-message" required rows="5" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div><button type="submit" disabled={state.submitting} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Send size={16} aria-hidden="true" />{state.submitting ? 'Submitting...' : 'Submit request'}</button>{state.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">{state.error}</p>}{state.success && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">{state.success}</p>}</form>
    </main>
  );
}