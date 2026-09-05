/**
 * Civil Disruption / Blockade Management Page.
 *
 * Provides UI for reporting, verifying, and resolving civil disruption events
 * (economic blockades, bandhs, strikes) that affect agricultural logistics
 * in Northeast India.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertTriangle, CheckCircle, XCircle, Search, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { civilDisruptionAPI } from '../services/api';

export default function DisruptionPage() {
  const [activeDisruptions, setActiveDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [formData, setFormData] = useState({
    disruptionType: 'blockade',
    title: '',
    description: '',
    affectedState: '',
    affectedDistrict: '',
    affectedRouteNames: '',
    startDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadActiveDisruptions();
  }, []);

  const loadActiveDisruptions = async () => {
    setLoading(true);
    try {
      const response = await civilDisruptionAPI.listActive();
      setActiveDisruptions(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load disruption data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await civilDisruptionAPI.report(formData);
      toast.success('Disruption reported successfully');
      setShowReportForm(false);
      setFormData({
        disruptionType: 'blockade',
        title: '',
        description: '',
        affectedState: '',
        affectedDistrict: '',
        affectedRouteNames: '',
        startDate: '',
      });
      await loadActiveDisruptions();
    } catch (error) {
      toast.error('Failed to report disruption');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      unverified: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getSeverityIcon = (type) => {
    return <AlertTriangle className="w-4 h-4 text-orange-500" />;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading disruption data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Civil Disruption Management</h1>
        <Button onClick={() => setShowReportForm(true)} className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Report Disruption
        </Button>
      </div>

      {showReportForm && (
        <Card>
          <CardHeader>
            <CardTitle>Report New Disruption</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <Label htmlFor="disruptionType">Disruption Type</Label>
                <select
                  id="disruptionType"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.disruptionType}
                  onChange={(e) => setFormData({ ...formData, disruptionType: e.target.value })}
                >
                  <option value="blockade">Economic Blockade</option>
                  <option value="bandh">Bandh/Strike</option>
                  <option value="natural_disaster">Natural Disaster</option>
                  <option value="infrastructure">Infrastructure Failure</option>
                </select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title of the disruption"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the disruption"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="affectedState">Affected State</Label>
                  <Input
                    id="affectedState"
                    value={formData.affectedState}
                    onChange={(e) => setFormData({ ...formData, affectedState: e.target.value })}
                    placeholder="e.g., Assam, Manipur"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="affectedDistrict">Affected District</Label>
                  <Input
                    id="affectedDistrict"
                    value={formData.affectedDistrict}
                    onChange={(e) => setFormData({ ...formData, affectedDistrict: e.target.value })}
                    placeholder="e.g., Kamrup, Imphal West"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="affectedRouteNames">Affected Routes (comma-separated)</Label>
                <Input
                  id="affectedRouteNames"
                  value={formData.affectedRouteNames}
                  onChange={(e) => setFormData({ ...formData, affectedRouteNames: e.target.value })}
                  placeholder="e.g., NH-37, NH-2, National Highway 37"
                />
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowReportForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Active Disruptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDisruptions.length === 0 ? (
            <p className="text-gray-500 text-sm">No active disruptions reported.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Routes Affected</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shipments Affected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDisruptions.map((disruption) => (
                  <TableRow key={disruption.id}>
                    <TableCell className="capitalize">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(disruption.disruption_type)}
                        {disruption.disruption_type}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{disruption.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {disruption.affected_state}
                        {disruption.affected_district && `, ${disruption.affected_district}`}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{disruption.affected_route_names || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {disruption.start_date ? new Date(disruption.start_date).toLocaleDateString('en-IN') : '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(disruption.status)}</TableCell>
                    <TableCell className="text-sm">{disruption.affected_shipment_count || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check Shipment Risk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="Enter Shipment ID" className="flex-1" />
            <Button variant="outline" className="flex items-center gap-2">
              <Search className="w-4 h-4" /> Check Risk
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
