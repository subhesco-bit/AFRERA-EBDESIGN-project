

/**
 * Value Badge Component
 * Displays value grade and score for products
 */
const ValueBadge = ({ valueScore, valueGrade, showDetails = false }) => {
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return 'bg-emerald-500';
      case 'A': return 'bg-green-500';
      case 'B+': return 'bg-teal-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getGradeTextColor = (grade) => {
    switch (grade) {
      case 'A+': return 'text-emerald-600';
      case 'A': return 'text-green-600';
      case 'B+': return 'text-teal-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`px-3 py-1 ${getGradeColor(valueGrade)} text-white font-bold rounded-full text-sm`}>
        {valueGrade}
      </div>
      <div className="text-sm">
        <span className="text-gray-500">Value Score:</span>
        <span className={`font-semibold ${getGradeTextColor(valueGrade)} ml-1`}>
          {valueScore?.toFixed(1) || 'N/A'}
        </span>
      </div>
      {showDetails && (
        <div className="ml-2 text-xs text-gray-400">
          Based on nutrition, quality, sustainability
        </div>
      )}
    </div>
  );
};

export default ValueBadge;
