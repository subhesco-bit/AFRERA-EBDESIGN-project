import { Snowflake } from 'lucide-react'
import { coldStorageAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/coldStorageRoutes.js +
 * services/legacy/coldStorageService.js. All 8 methods verified to exist
 * (2026-08-29). Facility/booking CRUD plus capacity-checked booking rule
 * and utilization rollup - ActionCard pattern (mixed CRUD + calculation ops).
 */
function ColdStoragePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Snowflake className="w-6 h-6 mr-2 text-cyan-600" />
          Cold Storage
        </h1>
        <p className="text-gray-600">Manage cold storage facilities, capacity-checked bookings, and utilization tracking.</p>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Facilities</h2>
      <ActionCard
        title="Create Facility"
        description="Register a new cold storage facility (admin only)."
        hasJsonPayload
        jsonLabel="Facility data (JSON)"
        jsonPlaceholder='{"name": "Guwahati Cold Hub", "capacityTons": 500, "location": "Guwahati"}'
        onRun={(_, payload) => coldStorageAPI.createFacility(payload)}
      />
      <ActionCard
        title="List Facilities"
        description="List cold storage facilities, optionally filtered."
        fields={[{ name: 'location', label: 'Location (optional)' }]}
        onRun={(v) => coldStorageAPI.getFacilities(v)}
      />
      <ActionCard
        title="Get Facility"
        description="Fetch a single facility by ID."
        fields={[{ name: 'facilityId', label: 'Facility ID' }]}
        onRun={(v) => coldStorageAPI.getFacility(v.facilityId)}
      />
      <ActionCard
        title="Update Facility"
        description="Update a facility's details (admin only)."
        fields={[{ name: 'facilityId', label: 'Facility ID' }]}
        hasJsonPayload
        jsonLabel="Update data (JSON)"
        jsonPlaceholder='{"capacityTons": 600}'
        onRun={(v, payload) => coldStorageAPI.updateFacility(v.facilityId, payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Utilization</h2>
      <ActionCard
        title="Get Utilization"
        description="Real capacity rollup for a single facility or all facilities."
        fields={[{ name: 'facilityId', label: 'Facility ID (optional)' }, { name: 'atDate', label: 'At Date (optional, YYYY-MM-DD)' }]}
        onRun={(v) => coldStorageAPI.getUtilization(v)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Bookings</h2>
      <ActionCard
        title="Create Booking"
        description="Book cold storage space (rejected with 422 if capacity is exceeded)."
        hasJsonPayload
        jsonLabel="Booking data (JSON)"
        jsonPlaceholder='{"facilityId": "F-1", "tons": 20, "startDate": "2026-09-01", "endDate": "2026-09-30"}'
        onRun={(_, payload) => coldStorageAPI.createBooking(payload)}
      />
      <ActionCard
        title="List Bookings"
        description="List bookings, optionally filtered."
        fields={[{ name: 'facilityId', label: 'Facility ID (optional)' }]}
        onRun={(v) => coldStorageAPI.getBookings(v)}
      />
      <ActionCard
        title="Update Booking Status"
        description="Update a booking's status (logistics roles only)."
        fields={[{ name: 'bookingId', label: 'Booking ID' }, { name: 'status', label: 'Status (e.g. confirmed, cancelled)' }]}
        onRun={(v) => coldStorageAPI.updateBookingStatus(v.bookingId, v.status)}
      />
    </div>
  )
}

export default ColdStoragePage
