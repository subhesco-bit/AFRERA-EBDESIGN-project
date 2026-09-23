import React from 'react';
export default function LedgerPage() {
  return <div className="p-8"><h1 className="text-3xl font-bold mb-4">Financial Ledger</h1><p className="text-gray-600 mb-6">Chart of accounts and GL posting</p><div className="space-y-4"><div className="p-4 bg-teal-50 rounded-lg"><h3 className="font-bold">Chart of Accounts</h3><p className="text-sm">Account registry with debit/credit posting</p></div><div className="p-4 bg-teal-50 rounded-lg"><h3 className="font-bold">Trial Balance</h3><p className="text-sm">Verification of GL posting accuracy</p></div><div className="p-4 bg-teal-50 rounded-lg"><h3 className="font-bold">Period Close</h3><p className="text-sm">P&L and Balance Sheet generation</p></div></div></div>;
}
