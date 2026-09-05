import React, { useState } from 'react';

export const TimeModal = (props) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-bold mb-4">{props.title || 'TimeModal'}</h2>
        {/* Component content */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            OK
          </button>
          <button className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeModal;
