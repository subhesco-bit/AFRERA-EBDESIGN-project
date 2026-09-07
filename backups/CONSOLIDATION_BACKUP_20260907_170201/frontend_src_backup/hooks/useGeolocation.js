import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useGeolocation — browser location with rural-connectivity defaults.
 *
 * WHY THIS EXISTS
 * The backend has geofencing, route optimisation, warehouse/farmer proximity
 * and shipment tracking (see backend/src/utils/geo.js), but the frontend never
 * called navigator.geolocation once — so nothing could supply the user's actual
 * position. This hook closes that gap.
 *
 * Deliberate choices for the target environment:
 *  - Permission is NEVER requested on mount. A location prompt on page load is
 *    the fastest way to get denied permanently. Call request() from a user
 *    gesture ("Find warehouses near me").
 *  - Coordinates are reported as null when unknown — never 0. The backend
 *    treats 0,0 as a real place (Gulf of Guinea), so sending 0 for "unknown"
 *    would place an unlocated user on Null Island.
 *  - Long timeout and generous maximumAge: a weak GPS fix on a rural network
 *    is better served by a slightly stale position than by an error.
 */

const DEFAULTS = {
  enableHighAccuracy: false, // low accuracy is far cheaper on battery and locks faster
  timeout: 20000,            // rural GPS fixes are slow; do not give up at 5s
  maximumAge: 120000         // a two-minute-old fix is fine for proximity search
}

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState({ latitude: null, longitude: null, accuracy: null })
  const [status, setStatus] = useState('idle') // idle | prompting | granted | denied | unavailable | error
  const [error, setError] = useState(null)
  const watchId = useRef(null)

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const handleError = useCallback((err) => {
    // Map the spec's numeric codes to something the UI can act on.
    if (err?.code === 1) {
      setStatus('denied')
      setError('Location permission was denied. You can enable it in your browser settings.')
    } else if (err?.code === 2) {
      setStatus('unavailable')
      setError('Location is unavailable right now. Try again with a clearer view of the sky.')
    } else if (err?.code === 3) {
      setStatus('error')
      setError('Getting your location timed out. Check your signal and try again.')
    } else {
      setStatus('error')
      setError('Could not determine your location.')
    }
  }, [])

  const applyPosition = useCallback((pos) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    })
    setStatus('granted')
    setError(null)
  }, [])

  /** Request a single fix. Call from a user gesture. */
  const request = useCallback(() => {
    if (!supported) {
      setStatus('unavailable')
      setError('This device or browser does not support location.')
      return
    }
    setStatus('prompting')
    navigator.geolocation.getCurrentPosition(applyPosition, handleError, {
      ...DEFAULTS,
      ...options
    })
  }, [supported, applyPosition, handleError, options])

  /** Continuous tracking — for live delivery/vehicle views only. */
  const startWatching = useCallback(() => {
    if (!supported || watchId.current !== null) return
    setStatus('prompting')
    watchId.current = navigator.geolocation.watchPosition(applyPosition, handleError, {
      ...DEFAULTS,
      enableHighAccuracy: true, // tracking justifies the battery cost
      ...options
    })
  }, [supported, applyPosition, handleError, options])

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [])

  // Always release the watch on unmount — a leaked watch keeps the GPS awake
  // and drains a phone battery in the field.
  useEffect(() => stopWatching, [stopWatching])

  return {
    ...position,
    status,
    error,
    supported,
    hasPosition: position.latitude !== null && position.longitude !== null,
    request,
    startWatching,
    stopWatching
  }
}

export default useGeolocation
