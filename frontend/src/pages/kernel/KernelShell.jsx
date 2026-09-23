import { Loader2, AlertCircle } from 'lucide-react';

/** Shared loading/error/content shell for all kernel/* pages. */
export default function KernelShell({ title, subtitle, loading, error, children }) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">{title}</h1>
      {subtitle && <p className="text-gray-600 mb-6">{subtitle}</p>}
      {loading && (
        <div className="flex items-center gap-2 text-gray-500 py-8">
          <Loader2 className="animate-spin" size={18} /> Loading real kernel data…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {!loading && !error && children}
    </div>
  );
}

export function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(([label, value]) => (
        <div key={label} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold">{String(value)}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLOR = { living: 'bg-green-100 text-green-800', partial: 'bg-amber-100 text-amber-800', missing: 'bg-gray-100 text-gray-500', refused: 'bg-red-100 text-red-700', pass: 'bg-green-100 text-green-800', block: 'bg-red-100 text-red-700', defer: 'bg-amber-100 text-amber-800', propose: 'bg-blue-100 text-blue-800', refuse: 'bg-red-100 text-red-700', named: 'bg-gray-100 text-gray-500' };

export function StatusBadge({ status }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}
