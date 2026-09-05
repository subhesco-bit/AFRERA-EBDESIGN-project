import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WeatherAnalyticsPage from '../pages/WeatherAnalyticsPage';
import MarketIntelligencePage from '../pages/MarketIntelligencePage';
import ComplianceDashboardPage from '../pages/ComplianceDashboardPage';
import QualityControlPage from '../pages/QualityControlPage';
import { weatherAPI, marketIntelligenceAPI, auditComplianceAPI, comprehensiveERPAPI } from '../services/api';

jest.mock('../services/api', () => ({
  weatherAPI: { coverage: jest.fn(), activeAlerts: jest.fn(), forecastAccuracy: jest.fn(), advisoryTriggers: jest.fn(), dispatchCheck: jest.fn() },
  marketIntelligenceAPI: { getLatestIntelligence: jest.fn(), createIntelligence: jest.fn() },
  auditComplianceAPI: { getAuditLogs: jest.fn(), listComplianceRules: jest.fn(), createAuditLog: jest.fn() },
  comprehensiveERPAPI: { recordInspectionResult: jest.fn() },
}));

describe('operational placeholder replacements', () => {
  beforeEach(() => { jest.clearAllMocks(); });
  it('renders weather data and checks dispatch', async () => {
    weatherAPI.coverage.mockResolvedValue({ data: { source: 'coverage' } }); weatherAPI.activeAlerts.mockResolvedValue({ data: [] }); weatherAPI.forecastAccuracy.mockResolvedValue({ data: { score: 0.8 } }); weatherAPI.advisoryTriggers.mockResolvedValue({ data: [] }); weatherAPI.dispatchCheck.mockResolvedValue({ data: [] });
    render(<WeatherAnalyticsPage />); await screen.findByText('Weather Analytics'); await waitFor(() => expect(weatherAPI.coverage).toHaveBeenCalled()); fireEvent.change(screen.getByLabelText(/districts/i), { target: { value: 'Assam' } }); fireEvent.click(screen.getByRole('button', { name: /check dispatch/i })); await waitFor(() => expect(weatherAPI.dispatchCheck).toHaveBeenCalledWith(['Assam']));
  });
  it('loads market intelligence and submits a record', async () => {
    marketIntelligenceAPI.getLatestIntelligence.mockResolvedValue({ data: { crop: 'rice' } }); marketIntelligenceAPI.createIntelligence.mockResolvedValue({ data: {} });
    render(<MarketIntelligencePage />); fireEvent.change(screen.getByLabelText(/village id/i), { target: { value: 'v1' } }); fireEvent.click(screen.getByRole('button', { name: /load latest/i })); await waitFor(() => expect(screen.getByText(/latest record/i)).toBeInTheDocument()); fireEvent.click(screen.getByRole('button', { name: /submit record/i })); await waitFor(() => expect(marketIntelligenceAPI.createIntelligence).toHaveBeenCalledWith({ village_id: 'v1' }));
  });
  it('renders compliance data and records a review', async () => {
    auditComplianceAPI.getAuditLogs.mockResolvedValue({ data: [] }); auditComplianceAPI.listComplianceRules.mockResolvedValue({ data: [] }); auditComplianceAPI.createAuditLog.mockResolvedValue({ data: {} });
    render(<ComplianceDashboardPage />); await screen.findByText('Compliance Dashboard'); await waitFor(() => expect(auditComplianceAPI.getAuditLogs).toHaveBeenCalled()); fireEvent.click(screen.getByRole('button', { name: /record dashboard review/i })); await waitFor(() => expect(auditComplianceAPI.createAuditLog).toHaveBeenCalled());
  });
  it('records a quality inspection result', async () => {
    comprehensiveERPAPI.recordInspectionResult.mockResolvedValue({ data: { id: 'r1' } }); render(<QualityControlPage />); fireEvent.change(screen.getByLabelText(/inspection lot/i), { target: { value: 'lot-1' } }); fireEvent.change(screen.getByLabelText(/inspection result/i), { target: { value: 'accepted' } }); fireEvent.click(screen.getByRole('button', { name: /record inspection result/i })); await waitFor(() => expect(comprehensiveERPAPI.recordInspectionResult).toHaveBeenCalledWith({ inspection_lot: 'lot-1', result: 'accepted' }));
  });
});
