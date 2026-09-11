import React from 'react';

export default function Dropdown(props) {
  return <div className="relative"><button className="px-4 py-2 border rounded">{props.label}</button><div className="absolute top-full mt-1 bg-white border rounded shadow">{props.children}</div></div>;
}
