import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { animalHealthAPI } from '../services/api'
import { HeartPulse, Plus, X, Trash2, Edit, Pill, AlertTriangle, ShieldAlert, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

const SPECIES = ['Poultry', 'Goat', 'Sheep', 'Pig', 'Cattle', 'Other']
const EXAMINATION_TYPES = ['Routine', 'Emergency', 'Follow-up', 'Preventive']
const TREATMENT_TYPES = ['Medication', 'Vaccination', 'Surgery', 'Therapy', 'Nutritional']
const DISEASE_SEVERITY = ['Mild', 'Moderate', 'Severe', 'Critical']
const QUARANTINE_STATUS = ['Active', 'Released', 'Deceased']

const emptyExamination = {
  animal_id: '', species: 'Cattle', examination_type: 'Routine', examination_date: '', 
  findings: '', diagnosis: '', examiner_name: '', notes: '',
}

const emptyTreatment = {
  examination_id: '', treatment_type: 'Medication', medication_name: '', dosage: '', 
  administration_route: '', start_date: '', end_date: '', notes: '',
}

const emptyOutbreak = {
  disease_name: '', species: 'Cattle', start_date: '', severity: 'Moderate', 
  affected_count: '', location: '', notes: '',
}

const emptyQuarantine = {
  animal_id: '', species: 'Cattle', reason: '', start_date: '', 
  expected_end_date: '', status: 'Active', notes: '',
}

function AnimalHealthPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('examination')
  const [editingId, setEditingId] = useState(null)
  const [examinationForm, setExaminationForm] = useState(emptyExamination)
  const [treatmentForm, setTreatmentForm] = useState(emptyTreatment)
  const [outbreakForm, setOutbreakForm] = useState(emptyOutbreak)
  const [quarantineForm, setQuarantineForm] = useState(emptyQuarantine)
  const [tab, setTab] = useState('examinations')

  const { data: examinationsData, isLoading, error } = useQuery({
    queryKey: ['animal-health-examinations'],
    queryFn: async () => (await animalHealthAPI.listExaminations()).data?.data ?? [],
  })

  const { data: treatmentsData, isLoading: treatmentsLoading, error: treatmentsError } = useQuery({
    queryKey: ['animal-health-treatments'],
    queryFn: async () => (await animalHealthAPI.listTreatments()).data?.data ?? [],
  })

  const { data: outbreaksData, isLoading: outbreaksLoading, error: outbreaksError } = useQuery({
    queryKey: ['animal-health-outbreaks'],
    queryFn: async () => (await animalHealthAPI.listDiseaseOutbreaks()).data?.data ?? [],
  })

  const { data: quarantinesData, isLoading: quarantinesLoading, error: quarantinesError } = useQuery({
    queryKey: ['animal-health-quarantines'],
    queryFn: async () => (await animalHealthAPI.listQuarantineRecords()).data?.data ?? [],
  })

  const { data: healthOverviewData, isLoading: healthOverviewLoading, error: healthOverviewError } = useQuery({
    queryKey: ['animal-health-overview'],
    queryFn: async () => (await animalHealthAPI.getHealthOverview()).data?.data ?? null,
    enabled: tab === 'overview',
  })

  const { data: activeOutbreaksData, isLoading: activeOutbreaksLoading, error: activeOutbreaksError } = useQuery({
    queryKey: ['animal-health-active-outbreaks'],
    queryFn: async () => (await animalHealthAPI.getActiveOutbreaks()).data?.data ?? null,
    enabled: tab === 'overview',
  })

  const { data: activeQuarantinesData, isLoading: activeQuarantinesLoading, error: activeQuarantinesError } = useQuery({
    queryKey: ['animal-health-active-quarantines'],
    queryFn: async () => (await animalHealthAPI.getActiveQuarantines()).data?.data ?? null,
    enabled: tab === 'overview',
  })

  const saveExaminationMutation = useMutation({
    mutationFn: (payload) => (editingId ? animalHealthAPI.updateExamination(editingId, payload) : animalHealthAPI.createExamination(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Examination updated' : 'Examination recorded')
      queryClient.invalidateQueries({ queryKey: ['animal-health-examinations'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save examination'),
  })

  const deleteExaminationMutation = useMutation({
    mutationFn: (id) => animalHealthAPI.deleteExamination(id),
    onSuccess: () => { toast.success('Examination removed'); queryClient.invalidateQueries({ queryKey: ['animal-health-examinations'] }) },
    onError: () => toast.error('Failed to remove examination'),
  })

  const saveTreatmentMutation = useMutation({
    mutationFn: (payload) => (editingId ? animalHealthAPI.updateTreatment(editingId, payload) : animalHealthAPI.createTreatment(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Treatment updated' : 'Treatment recorded')
      queryClient.invalidateQueries({ queryKey: ['animal-health-treatments'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save treatment'),
  })

  const saveOutbreakMutation = useMutation({
    mutationFn: (payload) => (editingId ? animalHealthAPI.updateOutbreak(editingId, payload) : animalHealthAPI.createOutbreak(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Outbreak updated' : 'Outbreak recorded')
      queryClient.invalidateQueries({ queryKey: ['animal-health-outbreaks'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save outbreak'),
  })

  const saveQuarantineMutation = useMutation({
    mutationFn: (payload) => (editingId ? animalHealthAPI.updateQuarantine(editingId, payload) : animalHealthAPI.createQuarantine(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Quarantine updated' : 'Quarantine recorded')
      queryClient.invalidateQueries({ queryKey: ['animal-health-quarantines'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save quarantine'),
  })

  const closeForm = () => { 
    setShowForm(false); 
    setEditingId(null); 
    setExaminationForm(emptyExamination);
    setTreatmentForm(emptyTreatment);
    setOutbreakForm(emptyOutbreak);
    setQuarantineForm(emptyQuarantine);
  }

  const openExaminationForm = () => {
    setFormType('examination');
    setExaminationForm(emptyExamination);
    setEditingId(null);
    setShowForm(true);
  }

  const openTreatmentForm = () => {
    setFormType('treatment');
    setTreatmentForm(emptyTreatment);
    setEditingId(null);
    setShowForm(true);
  }

  const openOutbreakForm = () => {
    setFormType('outbreak');
    setOutbreakForm(emptyOutbreak);
    setEditingId(null);
    setShowForm(true);
  }

  const openQuarantineForm = () => {
    setFormType('quarantine');
    setQuarantineForm(emptyQuarantine);
    setEditingId(null);
    setShowForm(true);
  }

  const examinations = examinationsData || []
  const treatments = treatmentsData || []
  const outbreaks = outbreaksData || []
  const quarantines = quarantinesData || []

  const activeQuarantines = quarantines.filter((q) => q.status === 'Active').length
  const activeOutbreaks = outbreaks.filter((o) => o.status === 'Active').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <HeartPulse className="w-6 h-6 mr-2 text-red-600" />
            Animal Health Management
          </h1>
          <p className="text-gray-600">Track examinations, treatments, disease outbreaks, and quarantine records</p>
        </div>
        {tab === 'examinations' && (
          <button onClick={openExaminationForm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Record Examination
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {['examinations', 'treatments', 'outbreaks', 'quarantines', 'overview'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium ${tab === t ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Total Examinations</div>
            <div className="text-2xl font-bold text-gray-800">{examinations.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Active Treatments</div>
            <div className="text-2xl font-bold text-gray-800">{treatments.filter((t) => t.status === 'Active').length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Active Outbreaks</div>
            <div className="text-2xl font-bold text-gray-800">{activeOutbreaks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Active Quarantines</div>
            <div className="text-2xl font-bold text-gray-800">{activeQuarantines}</div>
          </div>
        </div>
      )}

      {tab === 'examinations' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Species</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {examinations.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.animal_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.species}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.examination_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.examination_date ? e.examination_date.slice(0, 10) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.diagnosis || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => deleteExaminationMutation.mutate(e.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'treatments' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Pill className="w-5 h-5 mr-2" /> Record Treatment</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input placeholder="Examination ID" value={treatmentForm.examination_id} onChange={(e) => setTreatmentForm({...treatmentForm, examination_id: e.target.value})} className="px-3 py-2 border rounded" />
            <select value={treatmentForm.treatment_type} onChange={(e) => setTreatmentForm({...treatmentForm, treatment_type: e.target.value})} className="px-3 py-2 border rounded">
              {TREATMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Medication Name" value={treatmentForm.medication_name} onChange={(e) => setTreatmentForm({...treatmentForm, medication_name: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Dosage" value={treatmentForm.dosage} onChange={(e) => setTreatmentForm({...treatmentForm, dosage: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input placeholder="Administration Route" value={treatmentForm.administration_route} onChange={(e) => setTreatmentForm({...treatmentForm, administration_route: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={treatmentForm.start_date} onChange={(e) => setTreatmentForm({...treatmentForm, start_date: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" placeholder="End Date" value={treatmentForm.end_date} onChange={(e) => setTreatmentForm({...treatmentForm, end_date: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Notes" value={treatmentForm.notes} onChange={(e) => setTreatmentForm({...treatmentForm, notes: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => saveTreatmentMutation.mutate(treatmentForm)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Record Treatment</button>
        </div>
      )}

      {tab === 'outbreaks' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Record Disease Outbreak</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input placeholder="Disease Name" value={outbreakForm.disease_name} onChange={(e) => setOutbreakForm({...outbreakForm, disease_name: e.target.value})} className="px-3 py-2 border rounded" />
            <select value={outbreakForm.species} onChange={(e) => setOutbreakForm({...outbreakForm, species: e.target.value})} className="px-3 py-2 border rounded">
              {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={outbreakForm.start_date} onChange={(e) => setOutbreakForm({...outbreakForm, start_date: e.target.value})} className="px-3 py-2 border rounded" />
            <select value={outbreakForm.severity} onChange={(e) => setOutbreakForm({...outbreakForm, severity: e.target.value})} className="px-3 py-2 border rounded">
              {DISEASE_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="number" placeholder="Affected Count" value={outbreakForm.affected_count} onChange={(e) => setOutbreakForm({...outbreakForm, affected_count: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Location" value={outbreakForm.location} onChange={(e) => setOutbreakForm({...outbreakForm, location: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Notes" value={outbreakForm.notes} onChange={(e) => setOutbreakForm({...outbreakForm, notes: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => saveOutbreakMutation.mutate(outbreakForm)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Record Outbreak</button>
        </div>
      )}

      {tab === 'quarantines' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Record Quarantine</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input placeholder="Animal ID" value={quarantineForm.animal_id} onChange={(e) => setQuarantineForm({...quarantineForm, animal_id: e.target.value})} className="px-3 py-2 border rounded" />
            <select value={quarantineForm.species} onChange={(e) => setQuarantineForm({...quarantineForm, species: e.target.value})} className="px-3 py-2 border rounded">
              {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Reason" value={quarantineForm.reason} onChange={(e) => setQuarantineForm({...quarantineForm, reason: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={quarantineForm.start_date} onChange={(e) => setQuarantineForm({...quarantineForm, start_date: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="date" placeholder="Expected End Date" value={quarantineForm.expected_end_date} onChange={(e) => setQuarantineForm({...quarantineForm, expected_end_date: e.target.value})} className="px-3 py-2 border rounded" />
            <select value={quarantineForm.status} onChange={(e) => setQuarantineForm({...quarantineForm, status: e.target.value})} className="px-3 py-2 border rounded">
              {QUARANTINE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Notes" value={quarantineForm.notes} onChange={(e) => setQuarantineForm({...quarantineForm, notes: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => saveQuarantineMutation.mutate(quarantineForm)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Record Quarantine</button>
        </div>
      )}

      {showForm && formType === 'examination' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Record Examination</h3>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Animal ID" value={examinationForm.animal_id} onChange={(e) => setExaminationForm({...examinationForm, animal_id: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <select value={examinationForm.species} onChange={(e) => setExaminationForm({...examinationForm, species: e.target.value})} className="w-full px-3 py-2 border rounded">
                {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={examinationForm.examination_type} onChange={(e) => setExaminationForm({...examinationForm, examination_type: e.target.value})} className="w-full px-3 py-2 border rounded">
                {EXAMINATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="date" value={examinationForm.examination_date} onChange={(e) => setExaminationForm({...examinationForm, examination_date: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <textarea placeholder="Findings" value={examinationForm.findings} onChange={(e) => setExaminationForm({...examinationForm, findings: e.target.value})} className="w-full px-3 py-2 border rounded" rows="3" />
              <input placeholder="Diagnosis" value={examinationForm.diagnosis} onChange={(e) => setExaminationForm({...examinationForm, diagnosis: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <input placeholder="Examiner Name" value={examinationForm.examiner_name} onChange={(e) => setExaminationForm({...examinationForm, examiner_name: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <textarea placeholder="Notes" value={examinationForm.notes} onChange={(e) => setExaminationForm({...examinationForm, notes: e.target.value})} className="w-full px-3 py-2 border rounded" rows="2" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => saveExaminationMutation.mutate(examinationForm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Save</button>
              <button onClick={closeForm} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimalHealthPage
