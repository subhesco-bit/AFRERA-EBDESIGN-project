import React from 'react';

export default function Tooltip(props) {
  return <div className="relative group"><div className="invisible group-hover:visible bg-gray-900 text-white text-sm rounded px-2 py-1 absolute">{props.text}</div>{props.children}</div>;
}
