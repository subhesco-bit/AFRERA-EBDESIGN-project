import { useQuery } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { 
  Award, 
  TrendingUp, 
  Star, 
  Target, 
  BarChart3,
  Leaf,
  Droplets,
  Truck,
  DollarSign
} from 'lucide-react'

function HarvestScorePage() {
  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: harvestScore } = useQuery({
    queryKey: ['harvest-score'],
    queryFn: () => farmersAPI.getHarvestScore('current-farmer-id').then(r => r.data),
  })

  const { data: scoreHistory } = useQuery({
    queryKey: ['score-history'],
    queryFn: () => farmersAPI.getScoreHistory('current-farmer-id').then(r => r.data),
  })

  const { data: benchmarks } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: () => farmersAPI.getBenchmarks('current-farmer-id').then(r => r.data),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Harvest Score</h1>
        <p className="text-gray-600">Your agricultural performance score and improvement recommendations</p>
      </div>

      {/* Main Score Card */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Award className="w-8 h-8 mr-3" />
              <h2 className="text-3xl font-bold">Harvest Score</h2>
            </div>
            <p className="text-green-100">Based on your overall farming performance</p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold">{harvestScore?.total_score || 0}</div>
            <div className="text-xl text-green-100">out of 100</div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Leaf className="w-5 h-5 mr-2" />
              <span className="text-sm">Yield</span>
            </div>
            <div className="text-2xl font-bold">{harvestScore?.yield_score || 0}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Droplets className="w-5 h-5 mr-2" />
              <span className="text-sm">Resource Use</span>
            </div>
            <div className="text-2xl font-bold">{harvestScore?.resource_score || 0}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Truck className="w-5 h-5 mr-2" />
              <span className="text-sm">Timeliness</span>
            </div>
            <div className="text-2xl font-bold">{harvestScore?.timeliness_score || 0}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 mr-2" />
              <span className="text-sm">Profitability</span>
            </div>
            <div className="text-2xl font-bold">{harvestScore?.profit_score || 0}</div>
          </div>
        </div>
      </div>

      {/* Score History */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Score History
        </h2>

        <div className="space-y-3">
          {scoreHistory?.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{entry.season}</div>
                <div className="text-sm text-gray-500">{entry.period}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{entry.score}</div>
                <div className={`text-sm ${entry.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.change >= 0 ? '+' : ''}{entry.change} from previous
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              No historical data available
            </div>
          )}
        </div>
      </div>

      {/* Benchmark Comparison */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
          Benchmark Comparison
        </h2>

        <div className="space-y-4">
          {benchmarks?.map((benchmark) => (
            <div key={benchmark.category}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{benchmark.category}</span>
                <span className="text-sm text-gray-600">
                  Your: {benchmark.your_score} | Avg: {benchmark.average}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${(benchmark.your_score / benchmark.max) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{benchmark.percentile}th percentile</span>
                <span>{benchmark.gap > 0 ? `+${benchmark.gap} above average` : `${benchmark.gap} below average`}</span>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              No benchmark data available
            </div>
          )}
        </div>
      </div>

      {/* Improvement Recommendations */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-green-600" />
          Recommendations to Improve Your Score
        </h2>

        <div className="space-y-4">
          {harvestScore?.recommendations?.map((rec, index) => (
            <div key={index} className="flex items-start p-4 border rounded-lg">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                <Star className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-800">{rec.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Expected impact: +{rec.impact} points</span>
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              No recommendations at this time
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-green-600" />
          Achievements
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {harvestScore?.achievements?.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg text-center ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200 opacity-60'
              }`}
            >
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{achievement.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {achievement.unlocked ? 'Unlocked' : 'Locked'}
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-8 text-gray-500">
              No achievements yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HarvestScorePage