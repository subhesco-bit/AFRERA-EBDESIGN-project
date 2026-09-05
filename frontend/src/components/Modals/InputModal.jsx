import React, { useState } from 'react';

export const InputModal = ({
  title = 'Enter Information',
  message,
  placeholder,
  inputType = 'text',
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  required = false,
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (required && !value.trim()) {
      alert('This field is required');
      return;
    }
    onSubmit(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>

          {message && (
            <p className="text-sm text-gray-700 mb-4">{message}</p>
          )}

          <input
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {submitLabel}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
