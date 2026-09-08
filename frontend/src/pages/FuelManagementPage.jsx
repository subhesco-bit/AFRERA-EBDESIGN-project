import ModuleOperationPanel from '../components/common/ModuleOperationPanel';

/**
 * Fuel Management (backend/src/modules/M108). Generic operation panel -
 * see ModuleOperationPanel.jsx for why; no bespoke form has been built for
 * this module yet, but its real backend operations are fully callable here.
 */
export default function FuelManagementPage() {
  return (
    <ModuleOperationPanel
      moduleId="M108"
      title="Fuel Management"
      description="Fuel inventory and consumption tracking."
    />
  );
}
