import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calculator, DollarSign, Calendar, Info } from 'lucide-react';

const EMICalculatorPage = () => {
  const [loanDetails, setLoanDetails] = useState({
    amount: 100000,
    interestRate: 8.5,
    tenure: 12,
  });
  const [emi, setEMI] = useState(0);

  const calculateEMI = () => {
    const { amount, interestRate, tenure } = loanDetails;
    const monthlyRate = interestRate / 12 / 100;
    const months = tenure * 12;

    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                (Math.pow(1 + monthlyRate, months) - 1);

    setEMI(Math.round(emi));
  };

  const handleInputChange = (field, value) => {
    setLoanDetails(prev => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    calculateEMI();
  }, [loanDetails]);

  const totalPayment = emi * loanDetails.tenure * 12;
  const totalInterest = totalPayment - loanDetails.amount;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">EMI Calculator</h1>
          <p className="text-muted-foreground">Calculate your loan repayments</p>
        </div>
        <Button variant="outline">
          <Calculator className="mr-2 h-4 w-4" />
          Apply for Loan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>Enter your loan parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Loan Amount (₹)</label>
              <Input
                type="number"
                value={loanDetails.amount}
                onChange={(e) => handleInputChange('amount', parseInt(e.target.value))}
                placeholder="Enter loan amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Interest Rate (% per annum)</label>
              <Input
                type="number"
                value={loanDetails.interestRate}
                onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value))}
                placeholder="Enter interest rate"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Loan Tenure (years)</label>
              <Input
                type="number"
                value={loanDetails.tenure}
                onChange={(e) => handleInputChange('tenure', parseInt(e.target.value))}
                placeholder="Enter loan tenure"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EMI Calculation</CardTitle>
            <CardDescription>Your monthly repayment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Monthly EMI</div>
              <div className="text-3xl font-bold text-primary">₹{emi.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal Amount</span>
                <span className="font-medium">₹{loanDetails.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Interest</span>
                <span className="font-medium">₹{totalInterest.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total Payment</span>
                <span>₹{totalPayment.toLocaleString()}</span>
              </div>
            </div>
            <Button className="w-full mt-4">
              Download Schedule
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EMICalculatorPage;
