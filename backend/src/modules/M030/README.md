# M030 - Farmer Performance

Farmer performance module with existing advisory, IoT, alert, and analytics routes plus performance snapshot operations.

## Backend
- Advisory operations: `generateAdvisory`, `getFarmerAdvisories`, `getAdvisory`, `getAdvisoryAnalytics`
- IoT and alert operations: `registerIoTDevice`, `getIoTDeviceData`, `createAlert`, `getFarmerAlerts`, `markAlertAsRead`
- Performance operations: `createPerformanceSnapshot`, `getFarmerPerformance`
- Module backbone operations: `healthCheck`, `execute`

## API
- Dedicated module API: `/api/v1/modules/m030`
- Analytics route is declared before `/:advisoryId` to avoid route shadowing

## AI Integration
- Provides deterministic performance bands and improvement actions
- Keeps advisory generation available for Claude-compatible farmer support workflows
