import ModuleOperationPanel from '../components/common/ModuleOperationPanel';

/**
 * FPO Registration (backend/src/modules/M051). Generic operation panel -
 * see ModuleOperationPanel.jsx for why; no bespoke form has been built for
 * this module yet, but its real backend operations are fully callable here.
 */
export default function FPORegistrationPage() {
  return (
    <ModuleOperationPanel
      moduleId="M051"
      title="FPO Registration"
      description="Farmer Producer Organization registration and management."
    />
  );
}
