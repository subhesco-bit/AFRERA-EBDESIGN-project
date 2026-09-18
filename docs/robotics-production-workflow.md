# Robotics and Humanoid Orchestration

`services/robotics/roboticsOrchestrationService.js` is the canonical control plane for humanoids, field robots, warehouse robots, autonomous tractors, drones and simulated devices. Legacy robotics and robotic-farming imports delegate to it; they do not contain parallel business logic.

## Controlled workflow

1. An operations role registers a device against a named adapter. New devices are offline and uncertified.
2. A safety officer certifies the device. The creator cannot approve their own hazardous mission.
3. An operator creates a mission with explicit steps, constraints and hazard level. High/critical missions and steps that move, lift, cut, spray, harvest, excavate or operate machinery enter `pending_approval`.
4. The device publishes telemetry. Execution requires certified status, online status, no emergency stop, and a healthy `safetyInterlock` telemetry value.
5. A safety officer independently approves a hazardous mission. An approved mission can be sent to its registered adapter. Only one active mission is allowed per device.
6. Pause, completion, abort and emergency-stop transitions are persisted. Emergency stop calls the adapter, aborts active missions, latches the device, and can only be cleared by a safety officer with inspection evidence. Clearing leaves the device offline for deliberate recommissioning.
7. Telemetry and append-only audit events preserve operational evidence.

The built-in simulator implements the same dispatch and emergency-stop contract without moving physical equipment. Hardware vendors must supply an adapter with `dispatch` and `emergencyStop`, authenticate its telemetry ingestion, and complete device-specific certification before production use.

## AI boundary

`POST /api/v1/robotics/planning/advisory` calls the separate governed AI gateway to draft advice. The response always states that it does not authorize execution or persist a mission. Deterministic service and database rules remain responsible for approval, interlocks and adapter dispatch; model output never bypasses them.

## Operational limits

The repository includes the control plane and simulator, not a certified vendor hardware driver. Production commissioning still requires vendor protocol adapters, signed device identity, a real PostgreSQL migration run, network isolation, site risk assessment, physical stop validation and hardware-in-the-loop acceptance evidence.
