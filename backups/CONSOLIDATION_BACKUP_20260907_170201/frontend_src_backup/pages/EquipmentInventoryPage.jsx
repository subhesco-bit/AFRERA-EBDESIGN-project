import ModuleOperationPanel from '../components/common/ModuleOperationPanel'

/**
 * Equipment Inventory (backend/src/modules/M103). Generic operation panel -
 * see ModuleOperationPanel.jsx for why; no bespoke form has been built for
 * this module yet, but its real backend operations are fully callable here.
 */
export default function EquipmentInventoryPage() {
  return (
    <ModuleOperationPanel
      moduleId="M103"
      title="Equipment Inventory"
      description="Equipment inventory tracking and optimization."
    />
  )
}
