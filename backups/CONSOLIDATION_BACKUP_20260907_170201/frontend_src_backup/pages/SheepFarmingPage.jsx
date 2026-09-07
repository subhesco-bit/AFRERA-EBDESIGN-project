import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sheepAPI, sheepAIAPI } from '../services/api'
import { Rabbit, Plus, X, Trash2, Edit, Syringe, AlertTriangle, TrendingDown, TrendingUp, Wheat, Baby, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'
import ActionCard from '../components/common/ActionCard'

const BREEDS = ['Merino', 'Rambouillet', 'Dorper', 'Suffolk', 'Hampshire', 'Corriedale', 'Local / Desi', 'Crossbred']
const STATUSES = ['Active', 'Pregnant', 'Lambing', 'Weaning', 'Shearing', 'Sold', 'Deceased']

const emptyAnimal = {
  tag_id: '', breed: 'Local / Desi', dob: '', sex: 'female', status: 'Active', notes: '',
  last_vaccination_date: '', last_breeding_date: '', last_shearing_date: '',
}

function SheepFarmingPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyAnimal)
  const [woolForm, setWoolForm] = useState({ animal_id: '', date: '', weight_kg: '', grade: '', notes: '' })
  const [feedForm, setFeedForm] = useState({ animal_id: '', date: '', feed_type: '', quantity_kg: '', cost_per_kg: '' })
  const [breedingForm, setBreedingForm] = useState({ female_id: '', male_id: '', breeding_date: '', expected_lambing_date: '' })
  const [tab, setTab] = useState('flock')
  const [aiAnimalId, setAiAnimalId] = useState('')

  const { data: flockData, isLoading, error } = useQuery({
    queryKey: ['sheep-flock'],
    queryFn: async () => (await sheepAPI.listFlock()).data?.data ?? [],
  })

  const { data: woolData, isLoading: woolLoading, error: woolError } = useQuery({
    queryKey: ['sheep-wool-production'],
    queryFn: async () => (await sheepAPI.listWoolProduction()).data?.data ?? [],
  })

  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery({
    queryKey: ['sheep-flock-performance'],
    queryFn: async () => (await sheepAPI.getFlockPerformance()).data?.data ?? null,
    enabled: tab === 'insights',
  })

  const { data: breedingAlertsData, isLoading: breedingAlertsLoading, error: breedingAlertsError } = useQuery({
    queryKey: ['sheep-breeding-alerts'],
    queryFn: async () => (await sheepAPI.getBreedingAlerts()).data?.data ?? null,
    enabled: tab === 'insights',
  })

  const { data: vaccinationAlertsData, isLoading: vaccinationAlertsLoading, error: vaccinationAlertsError } = useQuery({
    queryKey: ['sheep-vaccination-alerts'],
    queryFn: async () => (await sheepAPI.getVaccinationAlerts()).data?.data ?? null,
    enabled: tab === 'insights',
  })

  const { data: shearingAlertsData, isLoading: shearingAlertsLoading, error: shearingAlertsError } = useQuery({
    queryKey: ['sheep-shearing-alerts'],
    queryFn: async () => (await sheepAPI.getShearingAlerts()).data?.data ?? null,
    enabled: tab === 'insights',
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? sheepAPI.updateAnimal(editingId, payload) : sheepAPI.createAnimal(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Animal updated' : 'Animal registered')
      queryClient.invalidateQueries({ queryKey: ['sheep-flock'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save animal'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => sheepAPI.deleteAnimal(id),
    onSuccess: () => { toast.success('Animal removed'); queryClient.invalidateQueries({ queryKey: ['sheep-flock'] }) },
    onError: () => toast.error('Failed to remove animal'),
  })

  const recordWoolMutation = useMutation({
    mutationFn: (payload) => sheepAPI.recordWoolProduction(payload),
    onSuccess: () => {
      toast.success('Wool production recorded')
      queryClient.invalidateQueries({ queryKey: ['sheep-wool-production'] })
      setWoolForm({ animal_id: '', date: '', weight_kg: '', grade: '', notes: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record wool production'),
  })

  const recordFeedMutation = useMutation({
    mutationFn: (payload) => sheepAPI.recordFeedConsumption(payload),
    onSuccess: () => {
      toast.success('Feed consumption recorded')
      queryClient.invalidateQueries({ queryKey: ['sheep-feed-consumption'] })
      setFeedForm({ animal_id: '', date: '', feed_type: '', quantity_kg: '', cost_per_kg: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record feed consumption'),
  })

  const recordBreedingMutation = useMutation({
    mutationFn: (payload) => sheepAPI.recordBreeding(payload),
    onSuccess: () => {
      toast.success('Breeding recorded')
      queryClient.invalidateQueries({ queryKey: ['sheep-breeding-records'] })
      setBreedingForm({ female_id: '', male_id: '', breeding_date: '', expected_lambing_date: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record breeding'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyAnimal) }

  const openEdit = (a) => {
    setForm({
      tag_id: a.tag_id || '', breed: a.breed || 'Local / Desi', dob: a.dob ? a.dob.slice(0, 10) : '', 
      sex: a.sex || 'female', status: a.status || 'Active', notes: a.notes || '',
      last_vaccination_date: a.last_vaccination_date ? a.last_vaccination_date.slice(0, 10) : '',
      last_breeding_date: a.last_breeding_date ? a.last_breeding_date.slice(0, 10) : '',
      last_shearing_date: a.last_shearing_date ? a.last_shearing_date.slice(0, 10) : '',
    })
    setEditingId(a.id)
    setShowForm(true)
  }

  const flock = flockData || []
  const woolRecords = woolData || []
  const pregnant = flock.filter((a) => a.status === 'Pregnant').length
  const totalWoolThisMonth = woolRecords.reduce((s, w) => s + (Number(w.weight_kg) || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            {/* Sheep icon does not exist in lucide-react; using the already-imported Rabbit icon
              (was previously an undefined "Sheep" reference that would ReferenceError on every render) */}
            <Rabbit className="w-6 h-6 mr-2 text-purple-600" />
            Sheep Farming
          </h1>
          <p className="text-gray-600">Track flock health, wool production, and breeding records</p>
        </div>
        {tab === 'flock' && (
          <button onClick={() => { setForm(emptyAnimal); setEditingId(null); setShowForm(true) }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Animal
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {['flock', 'wool', 'feed', 'breeding', 'insights', 'ai_insights'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium ${tab === t ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}>
            {t === 'ai_insights' ? 'AI Insights' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'flock' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Total Flock</div>
            <div className="text-2xl font-bold text-gray-800">{flock.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Pregnant</div>
            <div className="text-2xl font-bold text-gray-800">{pregnant}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Lambs</div>
            <div className="text-2xl font-bold text-gray-800">{flock.filter((a) => a.status === 'Lambing').length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Wool This Month (kg)</div>
            <div className="text-2xl font-bold text-gray-800">{totalWoolThisMonth.toFixed(1)}</div>
          </div>
        </div>
      )}

      {tab === 'flock' && (
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
              {flock.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.tag_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.breed}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.sex}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.dob ? a.dob.slice(0, 10) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${a.status === 'Active' ? 'bg-green-100 text-green-800' : a.status === 'Pregnant' ? 'bg-blue-100 text-blue-800' : a.status === 'Shearing' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
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

      {tab === 'wool' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Scissors className="w-5 h-5 mr-2" /> Record Wool Production</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input placeholder="Animal ID" value={woolForm.animal_id} onChange={(e) => setWoolForm({...woolForm, animal_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={woolForm.date} onChange={(e) => setWoolForm({...woolForm, date: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="number" placeholder="Weight (kg)" value={woolForm.weight_kg} onChange={(e) => setWoolForm({...woolForm, weight_kg: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Grade" value={woolForm.grade} onChange={(e) => setWoolForm({...woolForm, grade: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Notes" value={woolForm.notes} onChange={(e) => setWoolForm({...woolForm, notes: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => recordWoolMutation.mutate(woolForm)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Record Wool</button>
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
          <button onClick={() => recordFeedMutation.mutate(feedForm)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Record Feed</button>
        </div>
      )}

      {tab === 'breeding' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Baby className="w-5 h-5 mr-2" /> Record Breeding</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Female ID" value={breedingForm.female_id} onChange={(e) => setBreedingForm({...breedingForm, female_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Male ID" value={breedingForm.male_id} onChange={(e) => setBreedingForm({...breedingForm, male_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={breedingForm.breeding_date} onChange={(e) => setBreedingForm({...breedingForm, breeding_date: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" placeholder="Expected Lambing Date" value={breedingForm.expected_lambing_date} onChange={(e) => setBreedingForm({...breedingForm, expected_lambing_date: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => recordBreedingMutation.mutate(breedingForm)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Record Breeding</button>
        </div>
      )}

      {tab === 'ai_insights' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Animal</label>
            <select value={aiAnimalId} onChange={(e) => setAiAnimalId(e.target.value)} className="w-full md:w-72 px-3 py-2 border rounded">
              <option value="">Select an animal</option>
              {flock.map((a) => <option key={a.id} value={a.id}>{a.tag_id}</option>)}
            </select>
          </div>
          {!aiAnimalId && (
            <div className="text-sm text-gray-500 bg-white border rounded-lg p-4">Select an animal above to run AI actions against it.</div>
          )}
          {aiAnimalId && (
            <>
              <ActionCard
                title="Optimize Wool Production"
                description="AI analysis of recent wool production trend, with recommendations."
                onRun={() => sheepAIAPI.optimizeWoolProduction(aiAnimalId)}
              />
              <ActionCard
                title="Monitor Health"
                description="AI-powered health risk monitoring for this animal."
                onRun={() => sheepAIAPI.monitorSheepHealth(aiAnimalId)}
              />
              <ActionCard
                title="Optimize Feed"
                description="AI-recommended feed composition for a given production goal."
                fields={[{ name: 'productionGoal', label: 'Production Goal', placeholder: 'e.g. increase wool yield' }]}
                onRun={(v) => sheepAIAPI.optimizeSheepFeed(aiAnimalId, { productionGoal: v.productionGoal })}
              />
              <ActionCard
                title="Recommend Breeding"
                description="AI-powered breeding recommendations for this animal."
                onRun={() => sheepAIAPI.recommendSheepBreeding(aiAnimalId)}
              />
            </>
          )}
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
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
              <input type="date" placeholder="Last Shearing Date" value={form.last_shearing_date} onChange={(e) => setForm({...form, last_shearing_date: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border rounded" rows="3" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => saveMutation.mutate(form)} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
              <button onClick={closeForm} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SheepFarmingPage
