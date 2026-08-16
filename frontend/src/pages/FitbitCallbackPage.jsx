import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { wearableAPI } from '../services/api'

/**
 * Fitbit redirects the browser here (FITBIT_REDIRECT_URI) with ?code=...
 * after the user authorizes. This page's only job is to hand that code to
 * the backend, which does the real token exchange (wearableIntegrationService
 * .handleFitbitCallback) — this page never sees or stores a token itself.
 */
export default function FitbitCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setStatus('error')
      setError('No authorization code was returned by Fitbit.')
      return
    }
    wearableAPI.handleFitbitCallback(code)
      .then(() => {
        setStatus('done')
        setTimeout(() => navigate('/wearables'), 1200)
      })
      .catch((err) => {
        setStatus('error')
        setError(err.response?.data?.error || err.message)
      })
  }, [searchParams, navigate])

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      {status === 'connecting' && <p>Connecting your Fitbit account…</p>}
      {status === 'done' && <p>Connected — redirecting…</p>}
      {status === 'error' && (
        <div role="alert" className="rounded-md border border-sev-critical/30 bg-sev-critical/10 p-3 text-sm text-sev-critical">
          Could not connect Fitbit: {error}
        </div>
      )}
    </main>
  )
}
