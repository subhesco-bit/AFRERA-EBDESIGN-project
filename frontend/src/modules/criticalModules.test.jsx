import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import api from '../services/api'
import M001Page from './M001/M001Page'
import M016Page from './M016/M016Page'
import M084Page from './M084/M084Page'

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}))

describe('critical module pages', () => {
  beforeEach(() => {
    api.get.mockImplementation((path) => {
      if (path.includes('m001/health')) return Promise.resolve({ data: { data: { status: 'healthy' } } })
      if (path.includes('m001/metrics')) return Promise.resolve({ data: { data: { uptime: 3600, memory: { rss: 1024 } } } })
      if (path.includes('disaster-alerts')) return Promise.resolve({ data: { data: [] } })
      return Promise.resolve({ data: { data: [] } })
    })
    api.post.mockResolvedValue({ data: { success: true } })
  })

  test('renders platform status and initializes from the operator control', async () => {
    render(<M001Page />)
    expect(await screen.findByText('healthy')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/modules/m001/initialize', {}))
  })

  test('renders SSO identity controls', () => {
    render(<M016Page />)
    expect(screen.getByText('Single Sign-On')).toBeInTheDocument()
    expect(screen.getByLabelText('User UUID')).toBeInTheDocument()
  })

  test('renders disaster alert register and create control', async () => {
    render(<M084Page />)
    expect(await screen.findByText('Disaster Alerts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create alert' })).toBeInTheDocument()
  })
})
