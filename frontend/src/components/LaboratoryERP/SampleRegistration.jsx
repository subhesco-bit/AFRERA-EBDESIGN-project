import React, { useState, useEffect } from 'react';
import { laboratoryERPAPI } from '../../services/componentApi';

/**
 * Sample Registration Component
 * Allows users to register samples for laboratory testing
 *
 * FE-02 note: not resolved here. Laboratory/category/method lists are
 * reference data for a form, and the submit is a user-triggered POST — there
 * is no current parent page (unmounted as of 2026-08-07) to lift these into.
 * FE-01 (routing through api.js) is fixed below.
 */
const SampleRegistration = ({ onSuccess }) => {
  const [laboratories, setLaboratories] = useState([]);
  const [testCategories, setTestCategories] = useState([]);
  const [testMethods, setTestMethods] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    laboratory_id: '',
    sample_type: 'soil',
    sample_source: '',
    collection_date: '',
    collection_method: '',
    sample_description: '',
    quantity_g: '',
    batch_number: '',
    priority: 'normal',
    special_instructions: '',
  });

  useEffect(() => {
    fetchLaboratories();
    fetchTestCategories();
  }, []);

  const fetchLaboratories = async () => {
    try {
      const response = await laboratoryERPAPI.getLaboratories();
      setLaboratories(response.data);
    } catch (err) {
      console.error('Failed to fetch laboratories:', err);
    }
  };

  const fetchTestCategories = async () => {
    try {
      const response = await laboratoryERPAPI.getTestCategories();
      setTestCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch test categories:', err);
    }
  };

  const fetchTestMethods = async (categoryId) => {
    try {
      const response = await laboratoryERPAPI.getTestMethods(categoryId);
      setTestMethods(response.data);
    } catch (err) {
      console.error('Failed to fetch test methods:', err);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    fetchTestMethods(categoryId);
  };

  const handleTestToggle = (testMethodId) => {
    setSelectedTests(prev => {
      if (prev.includes(testMethodId)) {
        return prev.filter(id => id !== testMethodId);
      } else {
        return [...prev, testMethodId];
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await laboratoryERPAPI.registerSample({
        ...formData,
        quantity_g: parseFloat(formData.quantity_g),
        requested_tests: selectedTests,
      });

      onSuccess?.(response.data);

      // Reset form
      setFormData({
        laboratory_id: '',
        sample_type: 'soil',
        sample_source: '',
        collection_date: '',
        collection_method: '',
        sample_description: '',
        quantity_g: '',
        batch_number: '',
        priority: 'normal',
        special_instructions: '',
      });
      setSelectedTests([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Register Sample for Testing</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Laboratory Selection */}
        <div>
          <label htmlFor="laboratory_id" className="block text-sm font-medium text-gray-700 mb-2">
            Select Laboratory *
          </label>
          <select id="laboratory_id"
            name="laboratory_id"
            value={formData.laboratory_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select laboratory</option>
            {laboratories.map(lab => (
              <option key={lab.id} value={lab.id}>
                {lab.lab_name} ({lab.lab_code}) - {lab.city}
              </option>
            ))}
          </select>
        </div>

        {/* Sample Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sample_type" className="block text-sm font-medium text-gray-700 mb-2">
              Sample Type *
            </label>
            <select id="sample_type"
              name="sample_type"
              value={formData.sample_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="soil">Soil</option>
              <option value="water">Water</option>
              <option value="food">Food</option>
              <option value="plant">Plant</option>
            </select>
          </div>

          <div>
            <label htmlFor="sample_source" className="block text-sm font-medium text-gray-700 mb-2">
              Sample Source *
            </label>
            <input id="sample_source"
              type="text"
              name="sample_source"
              value={formData.sample_source}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Farm name, location"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="collection_date" className="block text-sm font-medium text-gray-700 mb-2">
              Collection Date *
            </label>
            <input id="collection_date"
              type="date"
              name="collection_date"
              value={formData.collection_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="collection_method" className="block text-sm font-medium text-gray-700 mb-2">
              Collection Method
            </label>
            <input id="collection_method"
              type="text"
              name="collection_method"
              value={formData.collection_method}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Core sampling, Grab sampling"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sample_description" className="block text-sm font-medium text-gray-700 mb-2">
            Sample Description *
          </label>
          <textarea id="sample_description"
            name="sample_description"
            value={formData.sample_description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the sample characteristics"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity_g" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity (grams) *
            </label>
            <input id="quantity_g"
              type="number"
              step="0.01"
              name="quantity_g"
              value={formData.quantity_g}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number
            </label>
            <input id="batch_number"
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional batch identifier"
            />
          </div>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Test Selection */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Tests</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Category
            </label>
            <select
              onChange={handleCategoryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category to view tests</option>
              {testCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {testMethods.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
              {testMethods.map(method => (
                <label key={method.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(method.id)}
                    onChange={() => handleTestToggle(method.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.code} - {method.turnaround_days} days</p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    ₹{method.cost_per_sample}
                  </span>
                </label>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-2">
            Selected tests: {selectedTests.length}
          </p>
        </div>

        <div>
          <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions
          </label>
          <textarea id="special_instructions"
            name="special_instructions"
            value={formData.special_instructions}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any special handling or testing requirements"
          />
        </div>

        <button
          type="submit"
          disabled={loading || selectedTests.length === 0}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Registering...' : 'Register Sample'}
        </button>
      </form>
    </div>
  );
};

export default SampleRegistration;
