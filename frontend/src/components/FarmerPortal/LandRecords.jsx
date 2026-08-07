/**
 * Land Records Component
 * Manages farmer land records with government integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { MapPin, FileText, Sync, CheckCircle, Clock, XCircle } from 'lucide-react';
import { farmerPortalAPI } from '../../services/api';

// FE-02 note: not resolved here. Every call in this component is either an
// authenticated read scoped to the logged-in farmer or a form
// submit/government-sync action — there's no fixed dataset a parent page
// could fetch once and hand down as props, so the calls stay in this
// component rather than being lifted to the parent. Mounted in
// FarmerPortalPage.jsx as of 2026-08-07.
// FE-01 (routing through api.js for auth) is fixed below.
const LandRecords = ({ farmerId }) => {
  const [landRecords, setLandRecords] = useState([]);
  const [totals, setTotals] = useState({ total_hectares: 0, total_acres: 0, total_plots: 0 });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    surveyNumber: '',
    village: '',
    district: '',
    state: 'Assam',
    areaInHectares: 0,
    areaInAcres: 0,
    soilType: 'alluvial',
    irrigationType: 'canal',
    ownershipType: 'own',
    landUseType: 'cultivation'
  });

  useEffect(() => {
    loadLandRecords();
  }, [farmerId]);

  const loadLandRecords = async () => {
    setLoading(true);
    try {
      const response = await farmerPortalAPI.getLandRecords();
      const data = response.data;
      setLandRecords(data.data.records);
      setTotals(data.data.totals);
    } catch (error) {
      console.error('Error loading land records:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLandRecord = async () => {
    setLoading(true);
    try {
      const response = await farmerPortalAPI.addLandRecord(newRecord);
      const data = response.data;
      if (data.success) {
        setDialogOpen(false);
        setNewRecord({
          surveyNumber: '',
          village: '',
          district: '',
          state: 'Assam',
          areaInHectares: 0,
          areaInAcres: 0,
          soilType: 'alluvial',
          irrigationType: 'canal',
          ownershipType: 'own',
          landUseType: 'cultivation'
        });
        loadLandRecords();
      }
    } catch (error) {
      console.error('Error adding land record:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithGovernment = async () => {
    setLoading(true);
    try {
      const response = await farmerPortalAPI.syncGovernmentLandRecords();
      const data = response.data;
      alert(`Synced ${data.data.syncedCount} records from government`);
      loadLandRecords();
    } catch (error) {
      console.error('Error syncing with government:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totals.total_hectares}</div>
            <div className="text-sm text-gray-600">Total Hectares</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totals.total_acres}</div>
            <div className="text-sm text-gray-600">Total Acres</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totals.total_plots}</div>
            <div className="text-sm text-gray-600">Total Plots</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Land Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Land Record</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Survey Number</Label>
                <Input
                  value={newRecord.surveyNumber}
                  onChange={(e) => setNewRecord({ ...newRecord, surveyNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Village</Label>
                <Input
                  value={newRecord.village}
                  onChange={(e) => setNewRecord({ ...newRecord, village: e.target.value })}
                />
              </div>
              <div>
                <Label>District</Label>
                <Input
                  value={newRecord.district}
                  onChange={(e) => setNewRecord({ ...newRecord, district: e.target.value })}
                />
              </div>
              <div>
                <Label>State</Label>
                <Select value={newRecord.state} onValueChange={(value) => setNewRecord({ ...newRecord, state: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assam">Assam</SelectItem>
                    <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                    <SelectItem value="Manipur">Manipur</SelectItem>
                    <SelectItem value="Nagaland">Nagaland</SelectItem>
                    <SelectItem value="Tripura">Tripura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Area (Hectares)</Label>
                <Input
                  type="number"
                  value={newRecord.areaInHectares}
                  onChange={(e) => setNewRecord({ ...newRecord, areaInHectares: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Area (Acres)</Label>
                <Input
                  type="number"
                  value={newRecord.areaInAcres}
                  onChange={(e) => setNewRecord({ ...newRecord, areaInAcres: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Soil Type</Label>
                <Select value={newRecord.soilType} onValueChange={(value) => setNewRecord({ ...newRecord, soilType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alluvial">Alluvial</SelectItem>
                    <SelectItem value="red_loamy">Red Loamy</SelectItem>
                    <SelectItem value="black_soil">Black Soil</SelectItem>
                    <SelectItem value="laterite">Laterite</SelectItem>
                    <SelectItem value="sandy">Sandy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Irrigation Type</Label>
                <Select value={newRecord.irrigationType} onValueChange={(value) => setNewRecord({ ...newRecord, irrigationType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canal">Canal</SelectItem>
                    <SelectItem value="tubewell">Tubewell</SelectItem>
                    <SelectItem value="rainfed">Rainfed</SelectItem>
                    <SelectItem value="drip">Drip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addLandRecord} disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Land Record'}
            </Button>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={syncWithGovernment} disabled={loading}>
          <Sync className="w-4 h-4 mr-2" />
          Sync with Government
        </Button>
      </div>

      {/* Land Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Land Records</CardTitle>
        </CardHeader>
        <CardContent>
          {landRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No land records found. Add your first land record!</p>
          ) : (
            <Table aria-label="Land records held for this farmer">
              <TableHeader>
                <TableRow>
                  <TableHead>Survey No.</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Area (Ha)</TableHead>
                  <TableHead>Soil Type</TableHead>
                  <TableHead>Irrigation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.survey_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {record.village}
                      </div>
                    </TableCell>
                    <TableCell>{record.district}</TableCell>
                    <TableCell>{record.area_in_hectares}</TableCell>
                    <TableCell className="capitalize">{record.soil_type}</TableCell>
                    <TableCell className="capitalize">{record.irrigation_type}</TableCell>
                    <TableCell>{getVerificationBadge(record.verification_status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LandRecords;
