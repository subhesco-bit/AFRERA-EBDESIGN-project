import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goatAPI } from '../services/api'
import { Rabbit, Plus, X, Trash2, Edit, Syringe, AlertTriangle, TrendingDown, TrendingUp, Wheat, Baby } from 'lucide-react'
import toast from 'react-hot-toast'

const BREEDS = ['Jamunapari', 'Beetal', 'Sirohi', 'Barbari', 'Black Bengal', 'Osmanabadi', 'Local / Desi', 'Crossbred']
const STATUSES = ['Lactating', 'Dry', 'Pregnant', 'Kid', 'Buck', 'Sold', 'Deceased']

const emptyAnimal = {
  tag_id: '', breed: 'Local / Desi', dob: '', sex: 'female', status: 'Lactating', notes: '',
  last_vaccination_date: '', last_breeding_date: '',
}

function GoatFarmingPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyAnimal)
  const [milkForm, setMilkForm] = useState({ animal_id: '', date: '', session: 'morning', quantity_liters: '' })
  const [feedForm, setFeedForm] = useState({ animal_id: '', date: '', feed_type: '', quantity_kg: '', cost_per_kg: '' })
  const [breedingForm, setBreedingForm] = useState({ female_id: '', male_id: '', breeding_date: '', expected_kidding_date: '' })
  const [tab, setTab] = useState('herd')

  const { data: herdData, isLoading, error } = useQuery({
    queryKey: ['goat-herd'],
    queryFn: async () => (await goatAPI.listHerd()).data?.data ?? [],
  })

  const { data: milkData, isLoading: milkLoading, error: milkError } = useQuery({
    queryKey: ['goat-milk-production'],
    queryFn: async () => (await goatAPI.listMilkProduction()).data?.data ?? [],
  })

  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery({
    queryKey: ['goat-herd-performance'],
    queryFn: async () => (await goatAPI.getHerdPerformance()).data?.data ?? null,
    enabled: tab === 'insights',
  })

  const { data: breedingAlertsData, isLoading: breedingAlertsLoading, error: breedingAlertsError } = useQuery({
    queryKey: ['goat-breeding-alerts'],
    queryFn: async () => (await goatAPI.getBreedingAlerts()).data?.data ?? null,
    enabled: tab === 'insights',
  })

  const { data: vaccinationAlertsData, isLoading: vaccinationAlertsLoading, error: vaccinationAlertsError } = useQuery({
    queryKey: ['goat-vaccination-alerts'],
    queryFn: async () => (await goatAPI.getVaccinationAlerts()).data?.data ?? null,
    enabled: tab === 'insights',
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? goatAPI.updateAnimal(editingId, payload) : goatAPI.createAnimal(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Animal updated' : 'Animal registered')
      queryClient.invalidateQueries({ queryKey: ['goat-herd'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save animal'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => goatAPI.deleteAnimal(id),
    onSuccess: () => { toast.success('Animal removed'); queryClient.invalidateQueries({ queryKey: ['goat-herd'] }) },
    onError: () => toast.error('Failed to remove animal'),
  })

  const recordMilkMutation = useMutation({
    mutationFn: (payload) => goatAPI.recordMilkProduction(payload),
    onSuccess: () => {
      toast.success('Milk production recorded')
      queryClient.invalidateQueries({ queryKey: ['goat-milk-production'] })
      setMilkForm({ animal_id: '', date: '', session: 'morning', quantity_liters: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record milk production'),
  })

  const recordFeedMutation = useMutation({
    mutationFn: (payload) => goatAPI.recordFeedConsumption(payload),
    onSuccess: () => {
      toast.success('Feed consumption recorded')
      queryClient.invalidateQueries({ queryKey: ['goat-feed-consumption'] })
      setFeedForm({ animal_id: '', date: '', feed_type: '', quantity_kg: '', cost_per_kg: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record feed consumption'),
  })

  const recordBreedingMutation = useMutation({
    mutationFn: (payload) => goatAPI.recordBreeding(payload),
    onSuccess: () => {
      toast.success('Breeding recorded')
      queryClient.invalidateQueries({ queryKey: ['goat-breeding-records'] })
      setBreedingForm({ female_id: '', male_id: '', breeding_date: '', expected_kidding_date: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record breeding'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyAnimal) }

  const openEdit = (a) => {
    setForm({
      tag_id: a.tag_id || '', breed: a.breed || 'Local / Desi', dob: a.dob ? a.dob.slice(0, 10) : '', 
      sex: a.sex || 'female', status: a.status || 'Lactating', notes: a.notes || '',
      last_vaccination_date: a.last_vaccination_date ? a.last_vaccination_date.slice(0, 10) : '',
      last_breeding_date: a.last_breeding_date ? a.last_breeding_date.slice(0, 10) : '',
    })
    setEditingId(a.id)
    setShowForm(true)
  }

  const herd = herdData || []
  const milkRecords = milkData || []
  const lactating = herd.filter((a) => a.status === 'Lactating').length
  const totalMilkToday = milkRecords.reduce((s, m) => s + (Number(m.quantity_liters) || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Goat className="w-6 h-6 mr-2 text-amber-600" />
            Goat Farming
          </h1>
          <p className="text-gray-600">Track herd health, milk production, and breeding records</p>
        </div>
        {tab === 'herd' && (
          <button onClick={() => { setForm(emptyAnimal); setEditingId(null); setShowForm(true) }}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Animal
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {['herd', 'milk', 'feed', 'breeding', 'insights'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium ${tab === t ? 'border-b-2 border-amber-600 text-amber-600' : 'text-gray-600'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'herd' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Total Herd</div>
            <div className="text-2xl font-bold text-gray-800">{herd.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Lactating</div>
            <div className="text-2xl font-bold text-gray-800">{lactating}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Kids</div>
            <div className="text-2xl font-bold text-gray-800">{herd.filter((a) => a.status === 'Kid').length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Milk Today (L)</div>
            <div className="text-2xl font-bold text-gray-800">{totalMilkToday.toFixed(1)}</div>
          </div>
        </div>
      )}

      {tab === 'herd' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sex</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {herd.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.tag_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.breed}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.sex}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.dob ? a.dob.slice(0, 10) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${a.status === 'Lactating' ? 'bg-green-100 text-green-800' : a.status === 'Pregnant' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => openEdit(a)} className="text-blue-600 hover:text-blue-800 mr-2"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteMutation.mutate(a.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'milk' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Goat className="w-5 h-5 mr-2" /> Record Milk Production</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Animal ID" value={milkForm.animal_id} onChange={(e) => setMilkForm({...milkForm, animal_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={milkForm.date} onChange={(e) => setMilkForm({...milkForm, date: e.target.value})} className="px-3 py-2 border rounded" />
            <select value={milkForm.session} onChange={(e) => setMilkForm({...milkForm, session: e.target.value})} className="px-3 py-2 border rounded">
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
            <input type="number" placeholder="Quantity (liters)" value={milkForm.quantity_liters} onChange={(e) => setMilkForm({...milkForm, quantity_liters: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => recordMilkMutation.mutate(milkForm)} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Record Production</button>
        </div>
      )}

      {tab === 'feed' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Wheat className="w-5 h-5 mr-2" /> Record Feed Consumption</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input placeholder="Animal ID" value={feedForm.animal_id} onChange={(e) => setFeedForm({...feedForm, animal_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={feedForm.date} onChange={(e) => setFeedForm({...feedForm, date: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Feed Type" value={feedForm.feed_type} onChange={(e) => setFeedForm({...feedForm, feed_type: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="number" placeholder="Quantity (kg)" value={feedForm.quantity_kg} onChange={(e) => setFeedForm({...feedForm, quantity_kg: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="number" placeholder="Cost per kg" value={feedForm.cost_per_kg} onChange={(e) => setFeedForm({...feedForm, cost_per_kg: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => recordFeedMutation.mutate(feedForm)} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Record Feed</button>
        </div>
      )}

      {tab === 'breeding' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Baby className="w-5 h-5 mr-2" /> Record Breeding</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Female ID" value={breedingForm.female_id} onChange={(e) => setBreedingForm({...breedingForm, female_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Male ID" value={breedingForm.male_id} onChange={(e) => setBreedingForm({...breedingForm, male_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={breedingForm.breeding_date} onChange={(e) => setBreedingForm({...breedingForm, breeding_date: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" placeholder="Expected Kidding Date" value={breedingForm.expected_kidding_date} onChange={(e) => setBreedingForm({...breedingForm, expected_kidding_date: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => recordBreedingMutation.mutate(breedingForm)} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Record Breeding</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Animal' : 'Add New Animal'}</h3>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Tag ID" value={form.tag_id} onChange={(e) => setForm({...form, tag_id: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <select value={form.breed} onChange={(e) => setForm({...form, breed: e.target.value})} className="w-full px-3 py-2 border rounded">
                {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input type="date" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <select value={form.sex} onChange={(e) => setForm({...form, sex: e.target.value})} className="w-full px-3 py-2 border rounded">
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" placeholder="Last Vaccination Date" value={form.last_vaccination_date} onChange={(e) => setForm({...form, last_vaccination_date: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <input type="date" placeholder="Last Breeding Date" value={form.last_breeding_date} onChange={(e) => setForm({...form, last_breeding_date: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border rounded" rows="3" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => saveMutation.mutate(form)} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Save</button>
              <button onClick={closeForm} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoatFarmingPage
