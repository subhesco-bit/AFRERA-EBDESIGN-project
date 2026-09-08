import React from 'react';

export default function Modal(props) {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div className="bg-white rounded-lg p-6 max-w-md">{props.children}</div></div>;
}
