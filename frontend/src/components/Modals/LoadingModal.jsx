import React from 'react';

export const LoadingModal = ({
  title = 'Loading',
  message = 'Please wait...',
  progress
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm text-gray-700">{message}</p>
          </div>

          {progress !== undefined && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-gray-600">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
