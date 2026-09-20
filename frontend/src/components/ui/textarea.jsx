import React from 'react';

function TextArea(props) {
  return <textarea className="w-full border rounded px-3 py-2" {...props} />;
}

export default TextArea;
export { TextArea, TextArea as Textarea };
