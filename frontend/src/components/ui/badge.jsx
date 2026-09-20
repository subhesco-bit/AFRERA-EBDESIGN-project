import React from 'react';

function Badge(props) {
  return <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{props.children}</span>;
}

export default Badge;
export { Badge };
