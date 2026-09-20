import React from 'react';

function Input(props) {
  return <input className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" {...props} />;
}

export default Input;
export { Input };
