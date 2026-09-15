import React from 'react';

export default function Card(props) {
  return <div className="bg-white rounded-lg shadow p-6">{props.children}</div>;
}
