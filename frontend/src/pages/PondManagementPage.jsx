import { Fish } from 'lucide-react';

// 2026-09-16: re-investigated this page's `pondAPI` (getPonds/createPond/
// updatePond/deletePond) as part of the pondAPI/medicalCodingAPI/
// nutritionIntelligenceAPI gap-closing pass. `pondAPI` was previously
// assumed (in .ai/tasks/AGENT_ASSIGNMENTS.md) to trace to a
// `createCrudService(...)` object in `services/legacy/fisheriesManagementService.js`
// that "just needs a router". That assumption doesn't hold on direct
// inspection:
// - `fisheriesManagementService.js` explicitly does NOT build pond
//   management - its own file header says so, deferring to
//   `backend/src/modules/M132` as "the real backend".
// - `modules/M132/README.md` claims M132 is "REAL (519-line service.js,
//   real controller.js/routes.js, real `ponds`/`pond_sensors` tables)".
//   That claim is false: `modules/M132/service.js` is 242 lines and
//   hardcodes `this.table = 'messaging'` - a generic scaffold entirely
//   unrelated to ponds. `modules/M132/model.sql` is a 2-line empty
//   placeholder ("-- Define tables and indexes here"), not the pond
//   schema the README describes. No `createPond`/`updatePond`/`getPonds`
//   method, and no query against a `ponds` table, exists anywhere in
//   `backend/src` (grepped directly, not by filename).
// - `database/migrations/016_advanced_ponds_iot.sql` does define real
//   `ponds`/`pond_sensors`/`pond_sensor_readings` tables with a shape
//   close to what this page expects (name/area/pond_type/metadata), but
//   zero service code anywhere reads or writes them - the schema exists
//   without any implementation behind it.
// `pondAPI` is correctly kept as a documented empty stub in
// `services/api.js` (grouped with the codebase's other confirmed-gap
// APIs). Wiring this page to a route that doesn't exist, or inventing
// pond CRUD logic ourselves, would be exactly the kind of fabrication
// this pass exists to avoid - so this page shows an honest "not
// available" state instead of a broken data table or a fake success
// toast.
function PondManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Fish className="w-6 h-6 mr-2 text-cyan-600" />
            Pond Management
          </h1>
          <p className="text-gray-600">Track fish ponds, stocking and water quality</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Fish className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Pond data isn&apos;t available yet</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          A pond schema exists in the database, but no backend service reads or writes it yet, so
          there&apos;s no real pond data to show or register here. This page will display your real
          ponds once that backend is built.
        </p>
      </div>
    </div>
  );
}

export default PondManagementPage;
