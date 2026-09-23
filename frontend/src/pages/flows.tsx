import React from 'react';
export default function FlowsPage() {
  return <div className="p-8"><h1 className="text-3xl font-bold mb-4">Workflow Flows</h1><p className="text-gray-600 mb-6">Loan, insurance, GST, and procurement workflows</p><div className="space-y-4"><div className="p-4 bg-red-50 rounded-lg"><h3 className="font-bold">Loan Flow</h3><p className="text-sm">Application → Appraisal → Credit → Approval → Disbursement</p></div><div className="p-4 bg-red-50 rounded-lg"><h3 className="font-bold">Insurance Claim</h3><p className="text-sm">Submit → Verify → Adjudicate → Settle</p></div><div className="p-4 bg-red-50 rounded-lg"><h3 className="font-bold">GST Invoice</h3><p className="text-sm">Create → Calculate → Report → E-way Bill → Remit</p></div></div></div>;
}
