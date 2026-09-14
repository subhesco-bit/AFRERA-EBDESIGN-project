import React from 'react';

export default function Toast(props) {
  return <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg">{props.message}</div>;
}
