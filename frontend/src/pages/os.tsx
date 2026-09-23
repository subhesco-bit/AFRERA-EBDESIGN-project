import React from 'react';
export default function OSPage() {
  return <div className="p-8"><h1 className="text-3xl font-bold mb-4">Operating System Layer</h1><p className="text-gray-600 mb-6">Service registry and bootstrap management</p><div className="space-y-4"><div className="p-4 bg-blue-100 rounded-lg"><h3 className="font-bold">Services</h3><p className="text-sm">Registered services and their status</p></div><div className="p-4 bg-blue-100 rounded-lg"><h3 className="font-bold">Bootstrap</h3><p className="text-sm">System initialization sequence</p></div></div></div>;
}
