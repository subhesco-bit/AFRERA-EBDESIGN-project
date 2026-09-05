describe('AI backbone startup loading', () => {
  it('loads enhanced recovery and optimization services', () => {
    const recovery = require('../../services/claude/aiRecoveryService');
    const optimization = require('../../services/claude/aiOptimizationService');

    expect(recovery).toBeDefined();
    expect(optimization).toBeDefined();

    recovery.originalService.stopHealthMonitoring();
    optimization.originalService.stopRealTimeMonitoring();
  });
});