import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Cpu, Sparkles, ArrowRight, ShieldCheck, Workflow } from 'lucide-react';
import { modulesAPI } from '../services/api';

function ModuleHubPage() {
  const [modules, setModules] = useState([]);
  const [overview, setOverview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    const loadPlatform = async () => {
      try {
        const [modulesResponse, overviewResponse] = await Promise.all([
          modulesAPI.getModules(),
          modulesAPI.getOverview()
        ]);

        setModules(modulesResponse.data.modules || []);
        setOverview(overviewResponse.data.overview || null);
      } catch (error) {
        console.error('Unable to load platform modules', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlatform();
  }, []);

  const handleAssistant = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) {
      return;
    }

    setAssistantLoading(true);
    try {
      const response = await modulesAPI.askAssistant(prompt);
      setAssistant(response.data.assistant || null);
    } catch (error) {
      console.error('Assistant request failed', error);
      setAssistant({ reply: 'The assistant is unavailable right now. Please try again shortly.', suggestedModules: ['Forms', 'Analytics'], confidence: 'medium' });
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-emerald-700 via-green-700 to-emerald-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium">
              <Cpu className="mr-2 h-4 w-4" />
              Complete AFRERA platform hub
            </div>
            <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
              One enterprise workspace for every module, experience, and AI workflow.
            </h1>
            <p className="mt-6 text-lg text-emerald-50">
              The platform now connects commerce, farming operations, logistics, quality, governance, analytics, and next-generation AI experiences into a single operating layer.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/forms" className="inline-flex items-center rounded-lg bg-white px-5 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50">
                Launch Forms Studio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/analytics" className="inline-flex items-center rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Open Analytics
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Modules available</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{overview?.totalModules || modules.length}</p>
            <p className="mt-2 text-sm text-slate-600">Across commerce, agriculture, quality, finance, logistics, and AI.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Production ready</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{overview?.readyModules ?? 0}</p>
            <p className="mt-2 text-sm text-slate-600">Core capabilities are wired and locally validated.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Innovation runway</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{overview?.betaModules ?? 0}</p>
            <p className="mt-2 text-sm text-slate-600">Beta modules include blockchain, IoT, and immersive experiences.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Platform modules</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Complete module catalogue</h2>
            </div>
            <div className="hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 md:block">
              {overview?.narrative || 'Enterprise-grade capabilities for every role'}
            </div>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-600">
              Loading platform modules...
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <div key={module.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                      {module.category === 'AI' ? <Bot className="h-5 w-5" /> : module.category === 'Operations' ? <Workflow className="h-5 w-5" /> : module.category === 'Trust' ? <ShieldCheck className="h-5 w-5" /> : <DatabaseZap className="h-5 w-5" />}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${module.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {module.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.summary}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {module.capabilities.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-start">
                        <Sparkles className="mr-2 mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 text-sm font-medium text-emerald-700">
                    {module.route ? <Link to={module.route === '/modules' ? '/modules' : module.route}>Open module →</Link> : 'Coming soon'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">AI companion</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Ask the platform what to activate next</h2>
            <form onSubmit={handleAssistant} className="mt-6 space-y-4">
              <textarea aria-label="Enter text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 focus:border-emerald-500"
                placeholder="Example: help me design forms and workflow automation"
              />
              <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700" disabled={assistantLoading}>
                {assistantLoading ? 'Thinking...' : 'Get recommendations'}
              </button>
            </form>
            {assistant && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">Recommendation</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{assistant.reply}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {assistant.suggestedModules.map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Launch stack</p>
            <h3 className="mt-2 text-2xl font-semibold">Latest technology integrations</h3>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>• AI-native workflows with analytics and copilots</li>
              <li>• Secure API gateway with resilient fallback mode</li>
              <li>• WebSockets for live operations and notifications</li>
              <li>• Blockchain-ready traceability and verification flows</li>
              <li>• IoT and AR/VR experiences for advanced field operations</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ModuleHubPage;
