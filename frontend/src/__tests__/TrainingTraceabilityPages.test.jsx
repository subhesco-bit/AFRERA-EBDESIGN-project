import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import TrainingAcademyPage from '../pages/TrainingAcademyPage'
import TraceabilityPage from '../pages/TraceabilityPage'
import { farmerTrainingAPI, blockchainTraceabilityAPI } from '../services/api'

jest.mock('../services/api', () => ({
  farmerTrainingAPI: { getPrograms: jest.fn(), register: jest.fn() },
  blockchainTraceabilityAPI: { getTraceabilityEvents: jest.fn(), verifyChainOfCustody: jest.fn() },
  organicTraceabilityAPI: { getConsumerTransparency: jest.fn() },
}))

describe('training and traceability pages', () => {
  beforeEach(() => jest.clearAllMocks())
  it('loads real programs and submits a registration', async () => {
    farmerTrainingAPI.getPrograms.mockResolvedValue({ data: [{ id: 'program-1', name: 'Organic farming' }] }); farmerTrainingAPI.register.mockResolvedValue({ data: { registration_id: 'registration-1' } })
    render(<TrainingAcademyPage />); expect(await screen.findByRole('heading', { name: 'Organic farming' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/farmer id/i), { target: { value: 'farmer-1' } }); fireEvent.change(screen.getByLabelText('Program'), { target: { value: 'program-1' } }); fireEvent.click(screen.getByRole('button', { name: /register for training/i }))
    await waitFor(() => expect(farmerTrainingAPI.register).toHaveBeenCalledWith(expect.objectContaining({ farmer_id: 'farmer-1', program_id: 'program-1' })))
  })
  it('looks up events and verifies custody using the API clients', async () => {
    blockchainTraceabilityAPI.getTraceabilityEvents.mockResolvedValue({ data: [{ id: 'event-1', event_type: 'Harvest' }] }); blockchainTraceabilityAPI.verifyChainOfCustody.mockResolvedValue({ data: { is_complete: true, chain: [{ id: 'custody-1' }] } })
    render(<TraceabilityPage />); fireEvent.change(screen.getByLabelText(/product id/i), { target: { value: 'product-1' } }); fireEvent.change(screen.getByLabelText(/batch number/i), { target: { value: 'batch-1' } }); fireEvent.click(screen.getByRole('button', { name: /lookup traceability/i }))
    await waitFor(() => expect(blockchainTraceabilityAPI.getTraceabilityEvents).toHaveBeenCalledWith('product-1', 'batch-1')); expect(await screen.findByText('Harvest')).toBeInTheDocument(); expect(screen.getByText(/api reported complete/i)).toBeInTheDocument()
  })
})