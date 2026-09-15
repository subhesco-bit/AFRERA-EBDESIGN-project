import React from 'react';

export default function Select(props) {
  return <select className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" {...props}>{props.children}</select>;
}
