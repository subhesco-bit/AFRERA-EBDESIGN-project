import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { farmersAPI, financialAPI } from '../services/api';
import { Leaf, Award, TrendingUp, DollarSign, Package, MapPin } from 'lucide-react';
import LandRecords from '../components/FarmerPortal/LandRecords';

function FarmerPortalPage() {
  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: farmerData } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => farmersAPI.getFarmer('current-farmer-id').then(r => r.data),
  });

  const { data: fdiData } = useQuery({
    queryKey: ['fdi'],
    queryFn: () => farmersAPI.calculateFDI('current-farmer-id').then(r => r.data),
  });

  const { data: creditScore } = useQuery({
    queryKey: ['credit-score'],
    queryFn: () => financialAPI.getCreditScore('current-farmer-id').then(r => r.data),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-v42-ink mb-8">Farmer Portal</h1>

      {/* FDI Section */}
      <div className="bg-v42-paddy rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-v42-ink mb-4 flex items-center">
          <Leaf className="w-5 h-5 mr-2 text-v42-forest" />
          Farmer Development Index
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-v42-forest mb-2">
              {fdiData?.fdi_score || 0}
            </div>
            <div className="text-sm text-v42-mut">FDI Score</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-v42-indigo mb-2">
              {fdiData?.fdi_grade || 'N/A'}
            </div>
            <div className="text-sm text-v42-mut">Grade</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-v42-turmericink mb-2">
              {fdiData?.advance_percentage || 0}%
            </div>
            <div className="text-sm text-v42-mut">Advance Eligibility</div>
          </div>
        </div>
      </div>

      {/* Credit Score */}
      <div className="bg-v42-paddy rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-v42-ink mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-v42-indigo" />
          Credit Score
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-v42-indigo">
              {creditScore?.score || 0}
            </div>
            <div className="text-sm text-v42-mut">Rating: {creditScore?.grade || 'N/A'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-v42-mut">Loan Limit</div>
            <div className="text-xl font-semibold text-v42-ink">
              ₹{creditScore?.factors?.loan_limit || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Link
          to="/wallet"
          className="bg-v42-paddy rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <TrendingUp className="w-8 h-8 text-v42-forest mb-3" />
          <h3 className="font-semibold text-v42-ink mb-1">Apply for Loan</h3>
          <p className="text-sm text-v42-mut">Get financial assistance for your farm</p>
        </Link>
        <Link
          to="/farmer-sell"
          className="bg-v42-paddy rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <DollarSign className="w-8 h-8 text-v42-turmericink mb-3" />
          <h3 className="font-semibold text-v42-ink mb-1">Request Advance</h3>
          <p className="text-sm text-v42-mut">Get pre-season advance based on FDI</p>
        </Link>
        <Link
          to="/farmer-sell"
          className="bg-v42-paddy rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <Package className="w-8 h-8 text-v42-indigo mb-3" />
          <h3 className="font-semibold text-v42-ink mb-1">My Products</h3>
          <p className="text-sm text-v42-mut">Manage your product listings</p>
        </Link>
        {/* No certifications module/route exists yet in this deployment — shown as
            an honest "coming soon" card rather than a dead-end clickable link. */}
        <div className="bg-v42-paddy rounded-lg shadow p-6 opacity-70 cursor-not-allowed">
          <Leaf className="w-8 h-8 text-v42-mut mb-3" />
          <h3 className="font-semibold text-v42-ink mb-1">Certifications</h3>
          <p className="text-sm text-v42-mut">Coming soon</p>
        </div>
      </div>

      {/* Land Records */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-v42-ink mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-v42-forest" />
          Land Records
        </h2>
        <LandRecords farmerId="current-farmer-id" />
      </div>

      {/* Recent Activity */}
      <div className="bg-v42-paddy rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-v42-ink mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-v42-mut">
          No recent activity to display
        </div>
      </div>
    </div>
  );
}

export default FarmerPortalPage;
