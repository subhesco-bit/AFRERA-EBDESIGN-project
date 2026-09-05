import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategicAPI } from '../services/api';
import { Building2, CheckCircle, AlertCircle, FileText, TrendingUp, Users } from 'lucide-react';

function GovernmentSubsidyPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('programs');

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['subsidy-programs'],
    queryFn: () => strategicAPI.government.getSubsidyPrograms().then(r => r.data),
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['subsidy-applications', user?.id],
    queryFn: () => strategicAPI.government.getFarmerDashboard({ userId: user?.id }).then(r => r.data),
    enabled: Boolean(user?.id) && user?.role === 'farmer',
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['government-dashboard'],
    queryFn: () => strategicAPI.government.getDashboard().then(r => r.data),
    enabled: user?.role === 'admin',
  });

  const submitApplicationMutation = useMutation({
    mutationFn: (data) => strategicAPI.government.submitApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subsidy-applications']);
      alert('Application submitted successfully!');
    },
    onError: (error) => {
      alert(`Failed to submit application: ${error.message}`);
    },
  });

  const handleApply = (programId) => {
    const applicationData = {
      program_id: programId,
      farmer_id: user?.id,
      land_hectares: 2.5,
      annual_income: 150000,
      crops: ['rice', 'wheat'],
    };
    submitApplicationMutation.mutate(applicationData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-8 h-8" />
          Government Subsidy Programs
        </h1>
        <p className="text-gray-600 mt-2">
          Apply for agricultural subsidies and track your application status
        </p>
      </div>

      {/* Admin Dashboard */}
      {user?.role === 'admin' && !dashboardLoading && dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Programs</p>
                <p className="text-2xl font-bold">{dashboard.active_programs || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Applications</p>
                <p className="text-2xl font-bold">{dashboard.pending_applications || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Disbursed</p>
                <p className="text-2xl font-bold">₹{dashboard.total_disbursed || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Beneficiaries</p>
                <p className="text-2xl font-bold">{dashboard.total_beneficiaries || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setSelectedTab('programs')}
          className={`px-4 py-2 font-medium ${selectedTab === 'programs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Available Programs
        </button>
        {user?.role === 'farmer' && (
          <button
            onClick={() => setSelectedTab('applications')}
            className={`px-4 py-2 font-medium ${selectedTab === 'applications' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            My Applications
          </button>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={() => setSelectedTab('dashboard')}
            className={`px-4 py-2 font-medium ${selectedTab === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            Admin Dashboard
          </button>
        )}
      </div>

      {selectedTab === 'programs' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Subsidy Programs</h2>
          {programsLoading ? (
            <div className="text-center py-8">Loading programs...</div>
          ) : programs?.items?.length > 0 ? (
            <div className="grid gap-4">
              {programs.items.map((program) => (
                <div key={program.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{program.program_name || 'Subsidy Program'}</h3>
                      <p className="text-gray-600">Ministry: {program.ministry || 'Agriculture'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{program.subsidy_amount || 0}</p>
                      <p className="text-sm text-gray-500">per farmer</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Subsidy Type</p>
                      <p className="font-semibold">{program.subsidy_type || 'Input-based'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Max Amount</p>
                      <p className="font-semibold">₹{program.maximum_subsidy_per_farmer || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Application Period</p>
                      <p className="font-semibold">{program.application_period_start || 'Open'}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm mb-2">Eligibility Criteria:</p>
                    <div className="flex flex-wrap gap-2">
                      {program.eligible_crops?.map((crop, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                  {user?.role === 'farmer' && (
                    <button
                      onClick={() => handleApply(program.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Apply for Subsidy
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No subsidy programs available at this time.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'applications' && user?.role === 'farmer' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Subsidy Applications</h2>
          {applicationsLoading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : applications?.applications?.length > 0 ? (
            <div className="grid gap-4">
              {applications.applications.map((application) => (
                <div key={application.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{application.program_name || 'Application'}</h3>
                      <p className="text-gray-600">Applied: {application.application_date || 'TBD'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                    }`}>
                      {application.status || 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Land Area</p>
                      <p className="font-semibold">{application.land_hectares || 0} hectares</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Annual Income</p>
                      <p className="font-semibold">₹{application.annual_income || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Subsidy Amount</p>
                      <p className="font-semibold">₹{application.subsidy_amount || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Verification</p>
                      <p className="font-semibold">{application.verification_status || 'Pending'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No subsidy applications. Browse available programs to apply.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'dashboard' && user?.role === 'admin' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Government Subsidy Dashboard</h2>
          {dashboardLoading ? (
            <div className="text-center py-8">Loading dashboard...</div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 border">
              <p className="text-gray-600">Admin dashboard features coming soon...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GovernmentSubsidyPage;
