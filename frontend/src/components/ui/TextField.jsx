import React from 'react';

export default function TextField(props) {
  return <div><label className="block text-sm font-medium mb-1">{props.label}</label><input className="w-full border rounded px-3 py-2" {...props} /></div>;
}
