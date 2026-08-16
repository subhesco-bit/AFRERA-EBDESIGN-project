import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { machineryAPI } from '../services/api'
import { Truck, Plus, X, Trash2, Edit, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['Available', 'Booked', 'Under Maintenance', 'Out of Service']

const emptyForm = { registration_no: '', model: '', horsepower: '', owner_name: '', status: 'Available', hourly_rate: '' }
const emptyBooking = { tractor_id: '', booked_by: '', start_date: '', end_date: '', purpose: '' }

function TractorManagementPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingForm, setBookingForm] = useState(emptyBooking)
  const [tab, setTab] = useState('fleet')

  const { data: fleetData, isLoading, error } = useQuery(
    'machinery-tractors',
    async () => (await machineryAPI.getTractors()).data?.data ?? []
  )

  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useQuery(
    'machinery-bookings',
    async () => (await machineryAPI.getBookings()).data?.data ?? []
  )

  const saveMutation = useMutation(
    (payload) => (editingId ? machineryAPI.updateTractor(editingId, payload) : machineryAPI.createTractor(payload)),
    {
      onSuccess: () => {
        toast.success(editingId ? 'Tractor updated' : 'Tractor registered')
        queryClient.invalidateQueries('machinery-tractors')
        closeForm()
      },
      onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save tractor'),
    }
  )

  const deleteMutation = useMutation((id) => machineryAPI.deleteTractor(id), {
    onSuccess: () => { toast.success('Tractor removed'); queryClient.invalidateQueries('machinery-tractors') },
    onError: () => toast.error('Failed to remove tractor'),
  })

  const bookMutation = useMutation((payload) => machineryAPI.createBooking(payload), {
    onSuccess: () => {
      toast.success('Booking created')
      queryClient.invalidateQueries('machinery-bookings')
      setShowBooking(false)
      setBookingForm(emptyBooking)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to create booking'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (t) => {
    setForm({
      registration_no: t.registration_no || '', model: t.model || '', horsepower: t.horsepower ?? '',
      owner_name: t.owner_name || '', status: t.status || 'Available', hourly_rate: t.hourly_rate ?? '',
    })
    setEditingId(t.id)
    setShowForm(true)
  }

  const fleet = fleetData || []
  const bookings = bookingsData || []
  const available = fleet.filter((t) => t.status === 'Available').length

  const statusColor = (s) => ({
    Available: 'bg-green-100 text-green-800',
    Booked: 'bg-blue-100 text-blue-800',
    'Under Maintenance': 'bg-yellow-100 text-yellow-800',
    'Out of Service': 'bg-red-100 text-red-800',
  }[s] || 'bg-gray-100 text-gray-700')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Truck className="w-6 h-6 mr-2 text-orange-600" />
            Tractor Management
          </h1>
          <p className="text-gray-600">Manage the tractor fleet and custom-hire bookings</p>
        </div>
        <div className="flex gap-2">
          {tab === 'bookings' && (
            <button onClick={() => setShowBooking(true)} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center">
              <CalendarClock className="w-5 h-5 mr-2" />New Booking
            </button>
          )}
          {tab === 'fleet' && (
            <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition flex items-center">
              <Plus className="w-5 h-5 mr-2" />Register Tractor
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Fleet size</div>
          <div className="text-2xl font-bold text-gray-800">{fleet.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Available now</div>
          <div className="text-2xl font-bold text-green-700">{available}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Active bookings</div>
          <div className="text-2xl font-bold text-gray-800">{bookings.length}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[['fleet', 'Fleet'], ['bookings', 'Bookings']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${tab === id ? 'border-orange-600 text-orange-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'fleet' && (
        <>
          {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading fleet: {error.message}. Backend endpoint /machinery/tractors has not been built yet — this page is wired and ready once it is.
            </div>
          )}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model / HP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fleet.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No tractors registered yet.</td></tr>}
                  {fleet.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{t.registration_no}</td>
                      <td className="px-4 py-3 text-gray-700">{t.model} {t.horsepower ? `(${t.horsepower} HP)` : ''}</td>
                      <td className="px-4 py-3 text-gray-700">{t.owner_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">₹{t.hourly_rate ?? '—'}/hr</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor(t.status)}`}>{t.status}</span></td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Remove this tractor?')) deleteMutation.mutate(t.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'bookings' && (
        <>
          {bookingsLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {bookingsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading bookings: {bookingsError.message}. Backend endpoint /machinery/bookings has not been built yet.
            </div>
          )}
          {!bookingsLoading && !bookingsError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tractor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked by</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No bookings yet.</td></tr>}
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{b.registration_no || b.tractor_id}</td>
                      <td className="px-4 py-3 text-gray-700">{b.booked_by}</td>
                      <td className="px-4 py-3 text-gray-700">{b.start_date} → {b.end_date}</td>
                      <td className="px-4 py-3 text-gray-700">{b.purpose || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Tractor' : 'Register Tractor'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.registration_no) { toast.error('Registration number is required'); return }
                  saveMutation.mutate({
                    ...form,
                    horsepower: form.horsepower === '' ? null : Number(form.horsepower),
                    hourly_rate: form.hourly_rate === '' ? null : Number(form.hourly_rate),
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration No. *</label>
                  <input value={form.registration_no} onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horsepower</label>
                    <input type="number" value={form.horsepower} onChange={(e) => setForm({ ...form, horsepower: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner name</label>
                  <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly rate (₹)</label>
                    <input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isLoading} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-60">
                    {saveMutation.isLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Register Tractor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">New Booking</h2>
                <button onClick={() => setShowBooking(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!bookingForm.tractor_id || !bookingForm.start_date) { toast.error('Tractor and start date are required'); return }
                  bookMutation.mutate(bookingForm)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tractor *</label>
                  <select value={bookingForm.tractor_id} onChange={(e) => setBookingForm({ ...bookingForm, tractor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select tractor</option>
                    {fleet.map((t) => <option key={t.id} value={t.id}>{t.registration_no}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booked by</label>
                  <input value={bookingForm.booked_by} onChange={(e) => setBookingForm({ ...bookingForm, booked_by: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
                    <input type="date" value={bookingForm.start_date} onChange={(e) => setBookingForm({ ...bookingForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                    <input type="date" value={bookingForm.end_date} onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <input value={bookingForm.purpose} onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="e.g., Ploughing" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowBooking(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={bookMutation.isLoading} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-60">
                    {bookMutation.isLoading ? 'Booking...' : 'Create Booking'}
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

export default TractorManagementPage
