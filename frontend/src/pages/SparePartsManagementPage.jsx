import ModuleOperationPanel from '../components/common/ModuleOperationPanel';

/**
 * Spare Parts Management (backend/src/modules/M109). Generic operation panel -
 * see ModuleOperationPanel.jsx for why; no bespoke form has been built for
 * this module yet, but its real backend operations are fully callable here.
 */
export default function SparePartsManagementPage() {
  return (
    <ModuleOperationPanel
      moduleId="M109"
      title="Spare Parts Management"
      description="Spare parts inventory and consumption tracking."
    />
  );
}
