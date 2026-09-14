import React from 'react';

export default function Alert(props) {
  return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">{props.message}</div>;
}
