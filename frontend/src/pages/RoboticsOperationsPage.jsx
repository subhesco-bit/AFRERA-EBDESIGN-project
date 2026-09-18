import { useState } from 'react';
import { roboticsAPI } from '../services/api';

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100';
const buttonClass = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';

function errorText(error) {
  return error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
}

export default function RoboticsOperationsPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [device, setDevice] = useState({ externalId: '', name: '', deviceType: 'simulator', adapter: 'simulator' });
  const [mission, setMission] = useState({ deviceId: '', name: '', hazardLevel: 'low', action: 'inspect' });
  const [missionRecord, setMissionRecord] = useState(null);
  const [advice, setAdvice] = useState('');

  async function execute(action, success) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await action();
      setMessage({ type: 'success', text: success });
      return response.data.data;
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error) });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function register(event) {
    event.preventDefault();
    const record = await execute(() => roboticsAPI.registerDevice({ ...device, capabilities: ['mission_execution'], safetyProfile: { physicalStopRequired: true } }), 'Device registered for safety certification.');
    if (record) setMission(current => ({ ...current, deviceId: record.id }));
  }

  async function createMission(event) {
    event.preventDefault();
    const record = await execute(() => roboticsAPI.createMission({
      deviceId: mission.deviceId,
      name: mission.name,
      hazardLevel: mission.hazardLevel,
      steps: [{ sequence: 1, action: mission.action }],
      constraints: { stopOnInterlockFailure: true },
    }), 'Mission created and routed through its required approval gate.');
    if (record) setMissionRecord(record);
  }

  async function missionAction(action, success) {
    if (!missionRecord?.id) return;
    const record = await execute(() => action(missionRecord.id), success);
    if (record) setMissionRecord(record);
  }

  async function requestAdvice(event) {
    event.preventDefault();
    const record = await execute(() => roboticsAPI.planAdvisory({
      deviceId: mission.deviceId,
      objective: advice,
      constraints: { noExecution: true },
    }), 'Advisory plan returned; it has no execution authority.');
    if (record) setAdvice(record.content || record.error || 'No generated advice was returned.');
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Embodied systems control plane</p>
        <h1 className="mt-2 text-3xl font-bold">Robotics Operations</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">Register and certify devices, approve missions, monitor telemetry, and control emergency stops. AI planning is advisory and cannot dispatch a robot.</p>
      </header>

      {message && <div role="status" className={`rounded-xl border p-4 text-sm ${message.type === 'error' ? 'border-red-300 bg-red-50 text-red-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>{message.text}</div>}

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={register} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div><h2 className="text-lg font-bold text-slate-900">1. Register device</h2><p className="text-sm text-slate-500">Registration never certifies or brings a device online.</p></div>
          <label className="block text-sm font-medium">External device ID<input className={`${fieldClass} mt-1`} value={device.externalId} onChange={e => setDevice({ ...device, externalId: e.target.value })} required /></label>
          <label className="block text-sm font-medium">Display name<input className={`${fieldClass} mt-1`} value={device.name} onChange={e => setDevice({ ...device, name: e.target.value })} required /></label>
          <label className="block text-sm font-medium">Device type<select className={`${fieldClass} mt-1`} value={device.deviceType} onChange={e => setDevice({ ...device, deviceType: e.target.value })}><option value="simulator">Simulator</option><option value="humanoid">Humanoid</option><option value="field_robot">Field robot</option><option value="warehouse_robot">Warehouse robot</option><option value="autonomous_tractor">Autonomous tractor</option><option value="drone">Drone</option></select></label>
          <button className={buttonClass} disabled={busy}>Register for certification</button>
        </form>

        <form onSubmit={createMission} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div><h2 className="text-lg font-bold text-slate-900">2. Define mission</h2><p className="text-sm text-slate-500">Hazard classification determines the independent approval gate.</p></div>
          <label className="block text-sm font-medium">Device ID<input className={`${fieldClass} mt-1`} value={mission.deviceId} onChange={e => setMission({ ...mission, deviceId: e.target.value })} required /></label>
          <label className="block text-sm font-medium">Mission name<input className={`${fieldClass} mt-1`} value={mission.name} onChange={e => setMission({ ...mission, name: e.target.value })} required /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Hazard level<select className={`${fieldClass} mt-1`} value={mission.hazardLevel} onChange={e => setMission({ ...mission, hazardLevel: e.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label><label className="block text-sm font-medium">Action<select className={`${fieldClass} mt-1`} value={mission.action} onChange={e => setMission({ ...mission, action: e.target.value })}><option>inspect</option><option>move</option><option>lift</option><option>spray</option><option>harvest</option></select></label></div>
          <button className={buttonClass} disabled={busy}>Create controlled mission</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">3. Mission control</h2><p className="text-sm text-slate-500">Current status: <strong>{missionRecord?.status || 'No mission selected'}</strong></p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Physical safety rules are deterministic</span></div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className={buttonClass} disabled={busy || !missionRecord} onClick={() => missionAction(id => roboticsAPI.approveMission(id, { approved: true, notes: 'Approved in operator console after safety review' }), 'Mission independently approved.')}>Approve</button>
          <button className={buttonClass} disabled={busy || !missionRecord} onClick={() => missionAction(roboticsAPI.startMission, 'Mission accepted by its device adapter.')}>Start</button>
          <button className={buttonClass} disabled={busy || !missionRecord} onClick={() => missionAction(id => roboticsAPI.pauseMission(id, 'Operator pause'), 'Mission paused.')}>Pause</button>
          <button className={buttonClass} disabled={busy || !missionRecord} onClick={() => missionAction(id => roboticsAPI.completeMission(id, 'Work verified complete'), 'Mission completed.')}>Complete</button>
          <button className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busy || !mission.deviceId} onClick={() => execute(() => roboticsAPI.emergencyStop(mission.deviceId, 'Emergency stop activated from operator console'), 'Emergency stop latched; active missions aborted.')}>Emergency stop</button>
        </div>
      </section>

      <form onSubmit={requestAdvice} className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div><h2 className="text-lg font-bold text-blue-950">Advisory mission planning</h2><p className="text-sm text-blue-800">The AI Backbone is a separate governed provider. Its response cannot create, approve, or execute a mission.</p></div>
        <textarea className={fieldClass} rows="4" value={advice} onChange={e => setAdvice(e.target.value)} placeholder="Describe an inspection or material-handling objective" required />
        <button className={buttonClass} disabled={busy}>Request advisory plan</button>
      </form>
    </main>
  );
}
