import React from 'react';

export default function Tab(props) {
  return <div className="flex border-b"><button className="px-4 py-2 border-b-2">{props.label}</button></div>;
}
