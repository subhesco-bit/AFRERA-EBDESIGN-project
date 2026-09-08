import { useState } from 'react';
import { Layers } from 'lucide-react';
import { sapModuleArchitectureAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/sapModuleArchitectureRoutes.js +
 * services/legacy/sapModuleArchitectureService.js (SAP-style independent
 * module architecture: registry, dependencies, lifecycle, configuration,
 * versioning, MTA descriptor - all 21 endpoints cross-checked against real
 * service methods 2026-08-29, zero broken calls). ActionCards grouped by
 * the route file's own section structure into tabs.
 */
const TABS = [
  ['registry', 'Module Registry'],
  ['dependencies', 'Dependencies'],
  ['lifecycle', 'Lifecycle & Versioning'],
  ['configuration', 'Configuration'],
  ['overview', 'Architecture Overview'],
];

function SAPModuleArchitecturePage() {
  const [tab, setTab] = useState('registry');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Layers className="w-6 h-6 mr-2 text-slate-700" />
          SAP Module Architecture
        </h1>
        <p className="text-gray-600">SAP-style independent module architecture: registration, dependency management, lifecycle, configuration and MTA descriptors.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'registry' && (
        <>
          <ActionCard title="List All Modules" description="Get all registered modules." onRun={() => sapModuleArchitectureAPI.getAllModules()} />
          <ActionCard title="Get Module" description="Get a module by ID." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.getModule(v.id)} />
          <ActionCard title="List Modules By Type" description="Get modules filtered by type (core, operation, innovation)." fields={[{ name: 'type', label: 'Type' }]} onRun={(v) => sapModuleArchitectureAPI.getModulesByType(v.type)} />
          <ActionCard title="Register Module" description="Register a new module." fields={[{ name: 'id', label: 'Module ID' }, { name: 'name', label: 'Name' }, { name: 'description', label: 'Description' }, { name: 'type', label: 'Type' }, { name: 'version', label: 'Version' }]} hasJsonPayload jsonLabel="Dependencies & Capabilities (optional)" jsonPlaceholder='{"dependencies": [], "capabilities": []}' onRun={(v, p) => sapModuleArchitectureAPI.registerModule({ id: v.id, name: v.name, description: v.description, type: v.type, version: v.version, ...p })} />
          <ActionCard title="Update Module" description="Update an existing module." fields={[{ name: 'id', label: 'Module ID' }]} hasJsonPayload jsonPlaceholder='{"description": "Updated description"}' onRun={(v, p) => sapModuleArchitectureAPI.updateModule(v.id, p)} />
          <ActionCard title="Delete Module" description="Delete a module." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.deleteModule(v.id)} />
        </>
      )}

      {tab === 'dependencies' && (
        <>
          <ActionCard title="Get Module Dependencies" description="Get the direct dependencies of a module." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.getModuleDependencies(v.id)} />
          <ActionCard title="Get Dependency Graph" description="Get the full module dependency graph." onRun={() => sapModuleArchitectureAPI.getDependencyGraph()} />
          <ActionCard title="Resolve Dependencies" description="Resolve the full dependency chain for a module." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.resolveDependencies(v.id)} />
          <ActionCard title="Get Module Compatibility" description="Check a module's compatibility info." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.getModuleCompatibility(v.id)} />
        </>
      )}

      {tab === 'lifecycle' && (
        <>
          <ActionCard title="Get Module Lifecycle" description="Get a module's lifecycle state history." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.getModuleLifecycle(v.id)} />
          <ActionCard title="Transition Module State" description="Transition a module to a new lifecycle state (draft, testing, production, maintenance, deprecated)." fields={[{ name: 'id', label: 'Module ID' }, { name: 'new_state', label: 'New State' }]} onRun={(v) => sapModuleArchitectureAPI.transitionModuleState(v.id, v.new_state)} />
          <ActionCard title="Get Module Version" description="Get a module's current version." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.getModuleVersion(v.id)} />
          <ActionCard title="Update Module Version" description="Update a module's version." fields={[{ name: 'id', label: 'Module ID' }, { name: 'version', label: 'New Version' }]} onRun={(v) => sapModuleArchitectureAPI.updateModuleVersion(v.id, v.version)} />
        </>
      )}

      {tab === 'configuration' && (
        <>
          <ActionCard title="Get Module Configuration" description="Get a module's configuration." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.getModuleConfiguration(v.id)} />
          <ActionCard title="Set Module Configuration" description="Set/replace a module's configuration." fields={[{ name: 'id', label: 'Module ID' }]} hasJsonPayload jsonPlaceholder='{"setting": "value"}' onRun={(v, p) => sapModuleArchitectureAPI.setModuleConfiguration(v.id, p)} />
          <ActionCard title="Generate MTA Descriptor" description="Generate the Multi-Target Application descriptor for a module." fields={[{ name: 'id', label: 'Module ID' }]} onRun={(v) => sapModuleArchitectureAPI.generateMTADescriptor(v.id)} />
        </>
      )}

      {tab === 'overview' && (
        <>
          <ActionCard title="Architecture Overview" description="Get the overall module architecture overview: counts by type/state, dependency graph, compliance metrics." onRun={() => sapModuleArchitectureAPI.getArchitectureOverview()} />
          <ActionCard title="Service Health" description="Check the SAP Module Architecture service health." onRun={() => sapModuleArchitectureAPI.getServiceHealth()} />
        </>
      )}
    </div>
  );
}

export default SAPModuleArchitecturePage;
