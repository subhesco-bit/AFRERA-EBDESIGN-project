import { Link, useLocation } from 'react-router-dom';
import { Bot, Database, GitBranch, ShieldCheck, Users } from 'lucide-react';

function titleFromPath(pathname) {
  const leaf = pathname.split('/').filter(Boolean).pop() || 'workspace';
  return leaf.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const title = titleFromPath(pathname);
  const capabilities = [
    { icon: Users, title: 'Stakeholder workspace', copy: `Role-aware tasks, evidence, approvals, and outcomes for the people responsible for ${title.toLowerCase()}.` },
    { icon: Database, title: 'ERP data contract', copy: 'Master data, transactions, documents, finance postings, and audit events use stable API contracts.' },
    { icon: Bot, title: 'AI assistance', copy: 'AI may summarise, classify, forecast, or recommend; confidence and provenance stay visible and humans approve regulated actions.' },
    { icon: GitBranch, title: 'Inter-system workflow', copy: 'Events connect marketplace, operations, finance, logistics, insurance, compliance, and reporting without duplicate entry.' },
    { icon: ShieldCheck, title: 'Control requirements', copy: 'Least-privilege access, consent, validation, exception queues, monitoring, and immutable audit history are mandatory.' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">System capability contract</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">This route does not pretend unfinished functionality is complete. It defines how the capability must serve stakeholders and integrate with ERP, AI, controls, and neighbouring systems before production activation.</p>
        </header>
        <section className="mt-6 grid gap-4 md:grid-cols-2">{capabilities.map(({ icon: Icon, title: itemTitle, copy }) => <article key={itemTitle} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-6 w-6 text-emerald-700" /><h2 className="mt-3 font-bold text-slate-950">{itemTitle}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></article>)}</section>
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-950">Activation checklist</h2><ol className="mt-3 grid gap-2 text-sm text-amber-900 sm:grid-cols-2"><li>1. Confirm stakeholder journeys and permissions</li><li>2. Approve data model and API contract</li><li>3. Implement happy path and exception states</li><li>4. Add AI evaluation and human approval gates</li><li>5. Connect ERP events and audit logging</li><li>6. Pass accessibility, mobile, security, and integration tests</li></ol></section>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/ai-product-studio" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Open integrated value chain</Link><Link to="/modules" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800">Open module registry</Link><Link to="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800">Return home</Link></div>
      </div>
    </main>
  );
}
