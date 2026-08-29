import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labourAPI } from '../services/api'
import { Users, Plus, X, CheckCircle2, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

const SKILLS = ['General', 'Machine Operator', 'Sprayer', 'Harvester', 'Irrigation', 'Supervisor']
const WAGE_TYPES = ['Daily', 'Piece Rate', 'Monthly']

const emptyWorker = { name: '', phone: '', skill: 'General', wage_type: 'Daily', wage_rate: '' }

function LabourManagementPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('workers')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyWorker)
  const [attendanceForm, setAttendanceForm] = useState({ worker_id: '', date: '', status: 'present', hours: '' })

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: workersData, isLoading: workersLoading, error: workersError } = useQuery({
    queryKey: ['labour-workers'],
    queryFn: async () => (await labourAPI.getWorkers()).data?.data ?? [],
  })

  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['labour-attendance'],
    queryFn: async () => (await labourAPI.getAttendance()).data?.data ?? [],
  })

  const { data: paymentsData } = useQuery({
    queryKey: ['labour-payments'],
    queryFn: async () => (await labourAPI.getPayments()).data?.data ?? [],
  })

  const createWorkerMutation = useMutation({
    mutationFn: (payload) => labourAPI.createWorker(payload),
    onSuccess: () => {
      toast.success('Worker added')
      queryClient.invalidateQueries({ queryKey: ['labour-workers'] })
      setShowForm(false)
      setForm(emptyWorker)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to add worker'),
  })

  const recordAttendanceMutation = useMutation({
    mutationFn: (payload) => labourAPI.recordAttendance(payload),
    onSuccess: () => {
      toast.success('Attendance recorded')
      queryClient.invalidateQueries({ queryKey: ['labour-attendance'] })
      setAttendanceForm({ worker_id: '', date: '', status: 'present', hours: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record attendance'),
  })

  const workers = workersData || []
  const attendance = attendanceData || []
  const payments = paymentsData || []
  const totalWageBill = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const presentToday = attendance.filter((a) => a.status === 'present').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Users className="w-6 h-6 mr-2 text-green-600" />
            Labour Management
          </h1>
          <p className="text-gray-600">Register farm workers, track attendance and wage payments</p>
        </div>
        {tab === 'workers' && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center">
            <Plus className="w-5 h-5 mr-2" />Add Worker
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Registered workers</div>
          <div className="text-2xl font-bold text-gray-800">{workers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Present (recorded)</div>
          <div className="text-2xl font-bold text-gray-800">{presentToday}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Wages paid</div>
          <div className="text-2xl font-bold text-gray-800 flex items-center"><IndianRupee className="w-5 h-5" />{totalWageBill.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[['workers', 'Workers'], ['attendance', 'Attendance']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${tab === id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'workers' && (
        <>
          {workersLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {workersError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading workers: {workersError.message}. Backend endpoint /labour/workers has not been built yet — this page is wired and ready once it is.
            </div>
          )}
          {!workersLoading && !workersError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workers.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No workers registered yet.</td></tr>}
                  {workers.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                      <td className="px-4 py-3 text-gray-700">{w.phone || '—'}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{w.skill}</span></td>
                      <td className="px-4 py-3 text-gray-700">₹{w.wage_rate} / {w.wage_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Record Attendance</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!attendanceForm.worker_id || !attendanceForm.date) { toast.error('Worker and date are required'); return }
                recordAttendanceMutation.mutate(attendanceForm)
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
            >
              <div>
                <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
                <select id="classname-w-full-px-3-py-2-border-border" value={attendanceForm.worker_id} onChange={(e) => setAttendanceForm({ ...attendanceForm, worker_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="">Select worker</option>
                  {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input id="classname-w-full-px-3-py-2-border-border-2" type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="classname-w-full-px-3-py-2-border-border-3" value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half day</option>
                </select>
              </div>
              <button type="submit" disabled={recordAttendanceMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />Record
              </button>
            </form>
          </div>

          {attendanceLoading && <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />}
          {attendanceError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading attendance: {attendanceError.message}. Backend endpoint /labour/attendance has not been built yet.
            </div>
          )}
          {!attendanceLoading && !attendanceError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500">No attendance recorded yet.</td></tr>}
                  {attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{a.worker_name || a.worker_id}</td>
                      <td className="px-4 py-3 text-gray-700">{a.date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'present' ? 'bg-green-100 text-green-800' : a.status === 'half_day' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add Worker</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.name) { toast.error('Name is required'); return }
                  createWorkerMutation.mutate({ ...form, wage_rate: form.wage_rate === '' ? null : Number(form.wage_rate) })
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input id="classname-w-full-px-3-py-2-border-border-4" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input id="classname-w-full-px-3-py-2-border-border-5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-6" className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                    <select id="classname-w-full-px-3-py-2-border-border-6" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-7" className="block text-sm font-medium text-gray-700 mb-1">Wage type</label>
                    <select id="classname-w-full-px-3-py-2-border-border-7" value={form.wage_type} onChange={(e) => setForm({ ...form, wage_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      {WAGE_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-8" className="block text-sm font-medium text-gray-700 mb-1">Wage rate (₹)</label>
                  <input id="classname-w-full-px-3-py-2-border-border-8" type="number" step="0.01" value={form.wage_rate} onChange={(e) => setForm({ ...form, wage_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={createWorkerMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                    {createWorkerMutation.isPending ? 'Saving...' : 'Add Worker'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default LabourManagementPage
