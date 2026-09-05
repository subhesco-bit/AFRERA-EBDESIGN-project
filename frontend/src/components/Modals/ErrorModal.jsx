import React from 'react';

export const ErrorModal = ({
  title = 'Error',
  message,
  error,
  onClose,
  onRetry,
  details,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.228 6.228a9 9 0 1012.544 0M9 11a3 3 0 106 0 3 3 0 00-6 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm text-gray-700">{message || error?.message}</p>
            {details && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 overflow-auto">
                {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
              </pre>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
