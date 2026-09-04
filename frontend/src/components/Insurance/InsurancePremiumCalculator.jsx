/**
 * Insurance Premium Calculator Component
 * Calculates premiums for various insurance types
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { insuranceAPI } from '../../services/componentApi';

// FE-02 note: not resolved here. Both calls are triggered by explicit user
// actions (submitting the calculator form, requesting a quote) over
// form state the user just typed in — there's no fixed dataset a parent page
// could pre-fetch and hand down as props. FE-01 (routing through api.js) is
// fixed below.
const InsurancePremiumCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [insuranceType, setInsuranceType] = useState('crop');
  const [premiumResult, setPremiumResult] = useState(null);

  const [cropData, setCropData] = useState({
    cropType: 'rice',
    areaInHectares: 1,
    sumInsuredPerHectare: 50000,
    location: 'Assam',
    season: 'kharif',
  });

  const [transitData, setTransitData] = useState({
    shipmentValue: 100000,
    origin: 'Guwahati',
    destination: 'Kolkata',
    transportMode: 'road',
    distance: 1000,
    goodsType: 'general',
    duration: 5,
  });

  const [warehouseData, setWarehouseData] = useState({
    warehouseValue: 5000000,
    location: 'Guwahati',
    buildingType: 'concrete',
    contentsValue: 2000000,
    fireProtection: 'yes',
    securityLevel: 'high',
  });

  const calculatePremium = async (type, data) => {
    setLoading(true);
    try {
      const response = await insuranceAPI.calculatePremiumByType(type, data);
      setPremiumResult(response.data.data);
    } catch (error) {
      console.error('Error calculating premium:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuote = async () => {
    setLoading(true);
    try {
      const data = insuranceType === 'crop' ? cropData :
        insuranceType === 'transit' ? transitData : warehouseData;

      const response = await insuranceAPI.generateQuote({
        insuranceType,
        policyholderId: 1, // Would come from auth
        ...data,
      });
      alert(`Quote Generated: ${response.data.data.quoteId}`);
    } catch (error) {
      console.error('Error generating quote:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurance Premium Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={insuranceType} onValueChange={setInsuranceType}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crop">Crop Insurance</TabsTrigger>
            <TabsTrigger value="transit">Transit Insurance</TabsTrigger>
            <TabsTrigger value="warehouse">Warehouse Insurance</TabsTrigger>
          </TabsList>

          <TabsContent value="crop" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Crop Type</Label>
                <Select value={cropData.cropType} onValueChange={(value) => setCropData({ ...cropData, cropType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="mustard">Mustard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Area (Hectares)</Label>
                <Input
                  type="number"
                  value={cropData.areaInHectares}
                  onChange={(e) => setCropData({ ...cropData, areaInHectares: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Sum Insured per Hectare (₹)</Label>
                <Input
                  type="number"
                  value={cropData.sumInsuredPerHectare}
                  onChange={(e) => setCropData({ ...cropData, sumInsuredPerHectare: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={cropData.location}
                  onChange={(e) => setCropData({ ...cropData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Season</Label>
                <Select value={cropData.season} onValueChange={(value) => setCropData({ ...cropData, season: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kharif">Kharif</SelectItem>
                    <SelectItem value="rabi">Rabi</SelectItem>
                    <SelectItem value="zaid">Zaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => calculatePremium('crop', cropData)} disabled={loading}>
              Calculate Premium
            </Button>
          </TabsContent>

          <TabsContent value="transit" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shipment Value (₹)</Label>
                <Input
                  type="number"
                  value={transitData.shipmentValue}
                  onChange={(e) => setTransitData({ ...transitData, shipmentValue: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Origin</Label>
                <Input
                  value={transitData.origin}
                  onChange={(e) => setTransitData({ ...transitData, origin: e.target.value })}
                />
              </div>
              <div>
                <Label>Destination</Label>
                <Input
                  value={transitData.destination}
                  onChange={(e) => setTransitData({ ...transitData, destination: e.target.value })}
                />
              </div>
              <div>
                <Label>Transport Mode</Label>
                <Select value={transitData.transportMode} onValueChange={(value) => setTransitData({ ...transitData, transportMode: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road">Road</SelectItem>
                    <SelectItem value="rail">Rail</SelectItem>
                    <SelectItem value="air">Air</SelectItem>
                    <SelectItem value="sea">Sea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Distance (km)</Label>
                <Input
                  type="number"
                  value={transitData.distance}
                  onChange={(e) => setTransitData({ ...transitData, distance: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  value={transitData.duration}
                  onChange={(e) => setTransitData({ ...transitData, duration: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <Button onClick={() => calculatePremium('transit', transitData)} disabled={loading}>
              Calculate Premium
            </Button>
          </TabsContent>

          <TabsContent value="warehouse" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Warehouse Value (₹)</Label>
                <Input
                  type="number"
                  value={warehouseData.warehouseValue}
                  onChange={(e) => setWarehouseData({ ...warehouseData, warehouseValue: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={warehouseData.location}
                  onChange={(e) => setWarehouseData({ ...warehouseData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Building Type</Label>
                <Select value={warehouseData.buildingType} onValueChange={(value) => setWarehouseData({ ...warehouseData, buildingType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concrete">Concrete</SelectItem>
                    <SelectItem value="brick">Brick</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contents Value (₹)</Label>
                <Input
                  type="number"
                  value={warehouseData.contentsValue}
                  onChange={(e) => setWarehouseData({ ...warehouseData, contentsValue: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fire Protection</Label>
                <Select value={warehouseData.fireProtection} onValueChange={(value) => setWarehouseData({ ...warehouseData, fireProtection: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Security Level</Label>
                <Select value={warehouseData.securityLevel} onValueChange={(value) => setWarehouseData({ ...warehouseData, securityLevel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => calculatePremium('warehouse', warehouseData)} disabled={loading}>
              Calculate Premium
            </Button>
          </TabsContent>
        </Tabs>

        {premiumResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Premium Calculation Result</h3>
            <Table aria-label="Insurance premium breakdown by component">
              <TableHeader>
                <TableRow>
                  <TableHead>Factor</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Gross Premium</TableCell>
                  <TableCell>₹{premiumResult.grossPremium}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Government Subsidy</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{premiumResult.subsidyRate}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Subsidy Amount</TableCell>
                  <TableCell>₹{premiumResult.subsidyAmount}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold">Net Premium (You Pay)</TableCell>
                  <TableCell className="font-bold text-green-600">₹{premiumResult.netPremium}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {premiumResult.riskFactors && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Risk Factors</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-red-50 rounded">
                    <div className="font-medium">Flood Risk</div>
                    <div>{(premiumResult.riskFactors.floodRisk * 100).toFixed(0)}%</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <div className="font-medium">Drought Risk</div>
                    <div>{(premiumResult.riskFactors.droughtRisk * 100).toFixed(0)}%</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <div className="font-medium">Pest Risk</div>
                    <div>{(premiumResult.riskFactors.pestRisk * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={generateQuote} className="mt-4" disabled={loading}>
              Generate Quote
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsurancePremiumCalculator;
