import ModuleOperationPanel from '../components/common/ModuleOperationPanel'

/**
 * Cattle Registry (backend/src/modules/M122). Generic operation panel -
 * see ModuleOperationPanel.jsx for why; no bespoke form has been built for
 * this module yet, but its real backend operations are fully callable here.
 */
export default function CattleRegistryPage() {
  return (
    <ModuleOperationPanel
      moduleId="M122"
      title="Cattle Registry"
      description="Comprehensive livestock cattle registry."
    />
  )
}
