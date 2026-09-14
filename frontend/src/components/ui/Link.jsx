import React from 'react';

export default function Link(props) {
  return <a className="text-blue-600 hover:underline" href={props.href}>{props.children}</a>;
}
