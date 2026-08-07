import React, { useState, useEffect } from 'react';

/**
 * Nutrition Label Component
 * Displays standardized nutrition information for products
 */
const NutritionLabel = ({ productId, showComparison = false }) => {
  const [nutritionData, setNutritionData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productId) {
      fetchNutritionData();
    }
  }, [productId]);

  const fetchNutritionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [nutritionResponse, scoreResponse] = await Promise.all([
        fetch(`/api/v1/nutrition-intelligence/product-nutrition/${productId}`),
        fetch(`/api/v1/nutrition-intelligence/product-nutrition/${productId}/score`)
      ]);

      if (!nutritionResponse.ok) throw new Error('Failed to fetch nutrition data');
      
      const nutrition = await nutritionResponse.json();
      setNutritionData(nutrition);

      if (scoreResponse.ok) {
        const score = await scoreResponse.json();
        setScoreData(score);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDailyValuePercentage = (value, dailyValue) => {
    if (!dailyValue || dailyValue === 0) return null;
    return Math.round((value / dailyValue) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !nutritionData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-500">Nutrition information not available</p>
      </div>
    );
  }

  const nutrition = nutritionData.nutrition_data;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with Grade */}
      <div className="border-b-4 border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Nutrition Facts</h3>
          {scoreData && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Nutrition Grade:</span>
              <span className={`px-3 py-1 text-white font-bold rounded ${getGradeColor(scoreData.grade)}`}>
                {scoreData.grade}
              </span>
              <span className="text-sm text-gray-600">({scoreData.overall_score}/100)</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Serving Size: {nutritionData.serving_size_g}g | Servings: {nutritionData.servings_per_container}
        </p>
      </div>

      {/* Calories */}
      <div className="border-b-2 border-gray-300 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-800">
            {nutritionData.calories_per_serving}
          </span>
          <span className="text-lg text-gray-600">Calories</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Calories per serving</p>
      </div>

      {/* Nutrients */}
      <div className="p-4 space-y-3">
        <div className="border-b border-gray-200 pb-2">
          <p className="text-sm text-gray-500 mb-1">% Daily Value*</p>
        </div>

        {/* Macronutrients */}
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-800">Total Fat</span>
          <div className="text-right">
            <span className="font-medium">{nutrition.FAT || 0}g</span>
            {nutrition.FAT && (
              <span className="text-sm text-gray-500 ml-2">
                {getDailyValuePercentage(nutrition.FAT, 65)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pl-4">
          <span className="text-sm text-gray-700">Saturated Fat</span>
          <div className="text-right">
            <span className="text-sm">{nutrition.SAT_FAT || 0}g</span>
            {nutrition.SAT_FAT && (
              <span className="text-xs text-gray-500 ml-2">
                {getDailyValuePercentage(nutrition.SAT_FAT, 20)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pl-4">
          <span className="text-sm text-gray-700">Trans Fat</span>
          <span className="text-sm">{nutrition.TRANS_FAT || 0}g</span>
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
          <span className="font-medium text-gray-800">Cholesterol</span>
          <div className="text-right">
            <span className="font-medium">{nutrition.CHOL || 0}mg</span>
            {nutrition.CHOL && (
              <span className="text-sm text-gray-500 ml-2">
                {getDailyValuePercentage(nutrition.CHOL, 300)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
          <span className="font-medium text-gray-800">Sodium</span>
          <div className="text-right">
            <span className="font-medium">{nutrition.SOD || 0}mg</span>
            {nutrition.SOD && (
              <span className="text-sm text-gray-500 ml-2">
                {getDailyValuePercentage(nutrition.SOD, 2300)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
          <span className="font-medium text-gray-800">Total Carbohydrate</span>
          <div className="text-right">
            <span className="font-medium">{nutrition.CARB || 0}g</span>
            {nutrition.CARB && (
              <span className="text-sm text-gray-500 ml-2">
                {getDailyValuePercentage(nutrition.CARB, 300)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pl-4">
          <span className="text-sm text-gray-700">Dietary Fiber</span>
          <div className="text-right">
            <span className="text-sm">{nutrition.FIB || 0}g</span>
            {nutrition.FIB && (
              <span className="text-xs text-gray-500 ml-2">
                {getDailyValuePercentage(nutrition.FIB, 25)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
          <span className="font-medium text-gray-800">Protein</span>
          <span className="font-medium">{nutrition.PRO || 0}g</span>
        </div>

        {/* Vitamins */}
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Vitamin A</span>
            <span className="text-sm">{nutrition.VIT_A || 0}mcg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Vitamin C</span>
            <span className="text-sm">{nutrition.VIT_C || 0}mg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Calcium</span>
            <span className="text-sm">{nutrition.CAL || 0}mg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Iron</span>
            <span className="text-sm">{nutrition.IRON || 0}mg</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 text-xs text-gray-600">
        <p>* Percent Daily Values are based on a 2,000 calorie diet.</p>
        <p className="mt-1">Your daily values may be higher or lower depending on your calorie needs.</p>
        {nutritionData.verification_method && (
          <p className="mt-2">
            <strong>Verification:</strong> {nutritionData.verification_method} 
            {nutritionData.confidence_score && ` (${(nutritionData.confidence_score * 100).toFixed(0)}% confidence)`}
          </p>
        )}
      </div>

      {showComparison && scoreData && (
        <div className="bg-blue-50 p-4 border-t">
          <p className="text-sm text-blue-800">
            <strong>Value-Based Pricing:</strong> This product qualifies for a nutrition-based price premium 
            due to its {scoreData.grade} grade.
          </p>
        </div>
      )}
    </div>
  );
};

export default NutritionLabel;
