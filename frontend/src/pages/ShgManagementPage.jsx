import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shgAPI } from '../services/api'
import { HandHeart, Plus, X, Users2, IndianRupee, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyGroup = { name: '', village: '', formation_date: '', focus_area: '' }
const emptyMember = { name: '', phone: '', role: 'Member' }
const emptySaving = { amount: '', date: '', type: 'deposit' }

function ShgManagementPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyGroup)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [memberForm, setMemberForm] = useState(emptyMember)
  const [savingForm, setSavingForm] = useState(emptySaving)

  const { data: groupsData, isLoading, error } = useQuery(
    'shg-groups',
    async () => (await shgAPI.getGroups()).data?.data ?? []
  )

  const { data: membersData, isLoading: membersLoading, error: membersError } = useQuery(
    ['shg-members', selectedGroup?.id],
    async () => (await shgAPI.getMembers(selectedGroup.id)).data?.data ?? [],
    { enabled: !!selectedGroup }
  )

  const { data: savingsData, isLoading: savingsLoading, error: savingsError } = useQuery(
    ['shg-savings', selectedGroup?.id],
    async () => (await shgAPI.getSavings(selectedGroup.id)).data?.data ?? [],
    { enabled: !!selectedGroup }
  )

  const createGroupMutation = useMutation((payload) => shgAPI.createGroup(payload), {
    onSuccess: () => {
      toast.success('SHG registered')
      queryClient.invalidateQueries('shg-groups')
      setShowForm(false)
      setForm(emptyGroup)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to register group'),
  })

  const addMemberMutation = useMutation((payload) => shgAPI.addMember(selectedGroup.id, payload), {
    onSuccess: () => {
      toast.success('Member added')
      queryClient.invalidateQueries(['shg-members', selectedGroup.id])
      setMemberForm(emptyMember)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to add member'),
  })

  const recordSavingMutation = useMutation((payload) => shgAPI.recordSaving(selectedGroup.id, payload), {
    onSuccess: () => {
      toast.success('Savings entry recorded')
      queryClient.invalidateQueries(['shg-savings', selectedGroup.id])
      setSavingForm(emptySaving)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record entry'),
  })

  const groups = groupsData || []
  const members = membersData || []
  const savings = savingsData || []
  const totalSavings = savings.reduce((s, x) => s + (x.type === 'withdrawal' ? -Number(x.amount || 0) : Number(x.amount || 0)), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <HandHeart className="w-6 h-6 mr-2 text-rose-600" />
            SHG Management
          </h1>
          <p className="text-gray-600">Register self-help groups, track membership and group savings</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition flex items-center">
          <Plus className="w-5 h-5 mr-2" />Register SHG
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading groups: {error.message}. Backend endpoint /shg/groups has not been built yet — this page is wired and ready once it is.
            </div>
          )}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
              <div className="px-4 py-3 font-semibold text-gray-800 flex items-center"><Users2 className="w-4 h-4 mr-2" />Groups ({groups.length})</div>
              {groups.length === 0 && <div className="px-4 py-10 text-center text-gray-500">No self-help groups registered yet.</div>}
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selectedGroup?.id === g.id ? 'bg-rose-50' : ''}`}
                >
                  <div className="font-medium text-gray-800">{g.name}</div>
                  <div className="text-xs text-gray-500">{g.village} {g.focus_area ? `• ${g.focus_area}` : ''}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {!selectedGroup && (
            <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
              Select a group from the list to manage its members and savings.
            </div>
          )}
          {selectedGroup && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="font-semibold text-gray-800 mb-1">{selectedGroup.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{selectedGroup.village}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700 flex items-center"><UserPlus className="w-4 h-4 mr-1" />Members ({members.length})</div>
                </div>
                {membersLoading && <div className="text-sm text-gray-500">Loading members…</div>}
                {membersError && <div className="text-sm text-red-600">Backend endpoint /shg/groups/:id/members has not been built yet.</div>}
                {!membersLoading && !membersError && (
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    {members.length === 0 && <li className="text-gray-400">No members yet.</li>}
                    {members.map((m) => <li key={m.id}>• {m.name} {m.role ? `(${m.role})` : ''}</li>)}
                  </ul>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!memberForm.name) { toast.error('Member name required'); return }
                    addMemberMutation.mutate(memberForm)
                  }}
                  className="flex flex-wrap gap-2"
                >
                  <input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    placeholder="Member name" className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500" />
                  <button type="submit" disabled={addMemberMutation.isLoading} className="px-3 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 disabled:opacity-60">Add</button>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700 flex items-center"><IndianRupee className="w-4 h-4 mr-1" />Group savings</div>
                  <div className="font-semibold text-gray-800">₹{totalSavings.toFixed(0)}</div>
                </div>
                {savingsLoading && <div className="text-sm text-gray-500">Loading savings…</div>}
                {savingsError && <div className="text-sm text-red-600">Backend endpoint /shg/groups/:id/savings has not been built yet.</div>}
                {!savingsLoading && !savingsError && (
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    {savings.length === 0 && <li className="text-gray-400">No savings entries yet.</li>}
                    {savings.slice(0, 6).map((s) => <li key={s.id}>• {s.date}: {s.type === 'withdrawal' ? '-' : '+'}₹{s.amount}</li>)}
                  </ul>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!savingForm.amount || !savingForm.date) { toast.error('Amount and date are required'); return }
                    recordSavingMutation.mutate({ ...savingForm, amount: Number(savingForm.amount) })
                  }}
                  className="grid grid-cols-3 gap-2"
                >
                  <input type="date" value={savingForm.date} onChange={(e) => setSavingForm({ ...savingForm, date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500" />
                  <input type="number" step="0.01" value={savingForm.amount} onChange={(e) => setSavingForm({ ...savingForm, amount: e.target.value })}
                    placeholder="Amount" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500" />
                  <select value={savingForm.type} onChange={(e) => setSavingForm({ ...savingForm, type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500">
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                  </select>
                  <button type="submit" disabled={recordSavingMutation.isLoading} className="col-span-3 px-3 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 disabled:opacity-60">
                    {recordSavingMutation.isLoading ? 'Saving...' : 'Record Entry'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Register SHG</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.name || !form.village) { toast.error('Group name and village are required'); return }
                  createGroupMutation.mutate(form)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                  <input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formation date</label>
                    <input type="date" value={form.formation_date} onChange={(e) => setForm({ ...form, formation_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Focus area</label>
                    <input value={form.focus_area} onChange={(e) => setForm({ ...form, focus_area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" placeholder="e.g., Handloom, Dairy" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={createGroupMutation.isLoading} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-60">
                    {createGroupMutation.isLoading ? 'Saving...' : 'Register SHG'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShgManagementPage
