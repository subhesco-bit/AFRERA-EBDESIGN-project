import React, { useState, useEffect } from 'react';
import { arVrAPI } from '../../services/componentApi';

/**
 * Experience Viewer Component
 * Displays AR/VR experiences and interaction points
 *
 * FE-02 note: this component has no current parent page (unmounted/orphaned
 * as of 2026-08-07 — grep finds no importer besides itself). It now accepts
 * an optional `experiences` prop so a future parent page can supply data
 * directly; when omitted it falls back to fetching for productId itself.
 */
const ExperienceViewer = ({ productId, experiences: experiencesProp }) => {
  const [experiences, setExperiences] = useState(experiencesProp || []);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [interactionPoints, setInteractionPoints] = useState([]);
  const [loading, setLoading] = useState(!experiencesProp);
  const [isVrMode, setIsVrMode] = useState(false);

  useEffect(() => {
    if (experiencesProp) {
      setExperiences(experiencesProp);
      setLoading(false);
      return;
    }
    fetchExperiences();
  }, [productId, experiencesProp]);

  const fetchExperiences = async () => {
    try {
      const response = await arVrAPI.getExperiences(productId, 'product');
      setExperiences(response.data);
    } catch (err) {
      console.error('Failed to fetch experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectExperience = async (experience) => {
    setSelectedExperience(experience);
    try {
      let response = await arVrAPI.getInteractionPoints(experience.id);
      setInteractionPoints(response.data);
    } catch (err) {
      console.error('Failed to fetch interaction points:', err);
    }
  };

  const getExperienceTypeColor = (type) => {
    switch (type) {
      case 'ar': return 'bg-purple-500';
      case 'vr': return 'bg-blue-500';
      case 'mixed_reality': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const getPointTypeIcon = (type) => {
    const icons = {
      hotspot: '📍',
      marker: '🏷️',
      trigger: '▶️',
      info_point: 'ℹ️',
    };
    return icons[type] || '•';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">AR/VR Experience Viewer</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVrMode(!isVrMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isVrMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isVrMode ? 'VR Mode' : 'AR Mode'}
          </button>
        </div>
      </div>

      {/* Experience List */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Available Experiences</h4>
        {experiences.length === 0 ? (
          <p className="text-gray-500 text-sm">No experiences available for this product</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                // Enter and Space are what a native <button> responds to.
                // Without this the card is unreachable by keyboard entirely.
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
                }}
                onClick={() => selectExperience(exp)}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                  selectedExperience?.id === exp.id ?
                    'border-blue-500 bg-blue-50' :
                    'border-gray-200 hover:border-gray-300'
                }`}
              >
                {exp.thumbnail_url && (
                  <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                    <img src={exp.thumbnail_url} alt={exp.experience_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 ${getExperienceTypeColor(exp.experience_type)} rounded-full`}></div>
                  <span className="text-xs text-gray-500 uppercase">{exp.experience_type}</span>
                </div>
                <p className="font-medium text-gray-800">{exp.experience_name}</p>
                <p className="text-sm text-gray-500 capitalize">{exp.experience_category}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Experience Details */}
      {selectedExperience && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Experience Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="text-gray-800">{selectedExperience.experience_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="capitalize text-gray-800">{selectedExperience.experience_type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-500">Category</p>
              <p className="capitalize text-gray-800">{selectedExperience.experience_category}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="capitalize text-gray-800">{selectedExperience.is_published ? 'Published' : 'Draft'}</p>
            </div>
          </div>
          {selectedExperience.description && (
            <div className="mt-4">
              <p className="text-gray-500">Description</p>
              <p className="text-gray-800">{selectedExperience.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Interaction Points */}
      {selectedExperience && interactionPoints.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">Interaction Points</h4>
          <div className="space-y-2">
            {interactionPoints.map((point) => (
              <div key={point.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">{getPointTypeIcon(point.point_type)}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{point.point_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{point.point_type.replace('_', ' ')}</p>
                </div>
                {point.position_x !== null && (
                  <div className="text-xs text-gray-500 font-mono">
                    ({point.position_x}, {point.position_y}, {point.position_z})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D Viewer Placeholder */}
      {selectedExperience && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 mb-2">3D Experience Viewer</h4>
          <p className="text-sm text-gray-600 mb-4">
            {isVrMode ? 'Put on your VR headset to experience this in virtual reality' : 'Point your camera at the product to view AR experience'}
          </p>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Launch Experience
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default ExperienceViewer;
