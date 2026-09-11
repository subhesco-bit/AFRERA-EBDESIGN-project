import React from 'react';

export default function Avatar(props) {
  return <img className="w-10 h-10 rounded-full" src={props.src} alt={props.alt} />;
}
