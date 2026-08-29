import ModuleOperationPanel from '../components/common/ModuleOperationPanel'

/**
 * Equipment Rental (backend/src/modules/M104). Generic operation panel -
 * see ModuleOperationPanel.jsx for why; no bespoke form has been built for
 * this module yet, but its real backend operations are fully callable here.
 */
export default function EquipmentRentalPage() {
  return (
    <ModuleOperationPanel
      moduleId="M104"
      title="Equipment Rental"
      description="Equipment rental marketplace and booking."
    />
  )
}
