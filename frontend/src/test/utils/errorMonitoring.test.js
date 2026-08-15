import { errorMonitoring, logError, getErrorStats, clearErrors } from '../../utils/errorMonitoring'

// Mock fetch for server communication
global.fetch = jest.fn()

describe('Error Monitoring', () => {
  beforeEach(() => {
    clearErrors()
    fetch.mockClear()
  })

  describe('logError', () => {
    it('adds error to queue', () => {
      const testError = {
        type: 'test',
        message: 'Test error message',
        timestamp: new Date().toISOString()
      }

      logError(testError)
      const stats = getErrorStats()

      expect(stats.totalErrors).toBe(1)
      expect(stats.recentErrors).toHaveLength(1)
      expect(stats.recentErrors[0].message).toBe('Test error message')
    })

    it('limits queue size to maxQueueSize', () => {
      // Add more errors than maxQueueSize (50)
      for (let i = 0; i < 60; i++) {
        logError({
          type: 'test',
          message: `Error ${i}`,
          timestamp: new Date().toISOString()
        })
      }

      const stats = getErrorStats()
      expect(stats.totalErrors).toBe(50) // Should be capped at maxQueueSize
    })

    it('attempts to send error to server when online', async () => {
      const testError = {
        type: 'test',
        message: 'Test error',
        timestamp: new Date().toISOString()
      }

      fetch.mockResolvedValueOnce({ ok: true })

      logError(testError)

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/errors/log',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })

  describe('getErrorStats', () => {
    it('returns current error statistics', () => {
      logError({
        type: 'test',
        message: 'Error 1',
        timestamp: new Date().toISOString()
      })

      const stats = getErrorStats()

      expect(stats).toHaveProperty('totalErrors')
      expect(stats).toHaveProperty('isOnline')
      expect(stats).toHaveProperty('recentErrors')
    })
  })

  describe('clearErrors', () => {
    it('clears all errors from queue', () => {
      logError({
        type: 'test',
        message: 'Test error',
        timestamp: new Date().toISOString()
      })

      clearErrors()

      const stats = getErrorStats()
      expect(stats.totalErrors).toBe(0)
      expect(stats.recentErrors).toHaveLength(0)
    })
  })
})
