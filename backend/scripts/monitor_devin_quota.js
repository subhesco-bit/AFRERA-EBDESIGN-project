/**
 * Monitor Devin quota status and auto-execute handoff when available
 * Usage: node scripts/monitor_devin_quota.js
 * This will check quota status every 5 minutes and auto-execute when ready
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const devinService = require('../src/services/devinService');

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TARGET_RESET_TIME = new Date('2026-09-10T13:30:00+05:30'); // Sept 10, 1:30 PM IST

async function checkAndExecute() {
  console.log('=== Devin Quota Monitor ===');
  console.log('Time:', new Date().toISOString());
  console.log('Target Reset Time:', TARGET_RESET_TIME.toISOString());
  console.log('Time Until Reset:', Math.floor((TARGET_RESET_TIME - new Date()) / 1000 / 60), 'minutes');
  console.log('');

  const status = devinService.getStatus();
  
  if (!status.configured) {
    console.log('❌ Devin not configured');
    return false;
  }

  console.log('Testing quota status...');

  try {
    const axios = require('axios');
    const testPayload = {
      prompt: "Connection test",
      title: "Quota Monitor Test",
      tags: ["monitor"]
    };

    const response = await axios.post(
      `${process.env.DEVIN_API_URL || 'https://api.devin.ai/v1'}/sessions`,
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEVIN_API_KEY}`
        },
        timeout: 10000
      }
    );

    console.log('✅ QUOTA AVAILABLE - Connection successful!');
    console.log('Status:', response.status);
    
    // Clean up test session
    if (response.data.id) {
      try {
        await axios.post(
          `${process.env.DEVIN_API_URL || 'https://api.devin.ai/v1'}/sessions/${response.data.id}/close`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${process.env.DEVIN_API_KEY}`
            },
            timeout: 5000
          }
        );
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    console.log('');
    console.log('🚀 EXECUTING DEVIN HANDOFF...');
    
    // Execute the actual handoff
    const { execSync } = require('child_process');
    try {
      const handoffResult = execSync('node scripts/trigger_devin_handoff.js', {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 30000
      });
      console.log(handoffResult);
      console.log('');
      console.log('✅ DEVIN HANDOFF EXECUTED SUCCESSFULLY');
      return true; // Stop monitoring
    } catch (handoffError) {
      console.error('❌ Handoff execution failed:', handoffError.message);
      return false; // Continue monitoring
    }

  } catch (error) {
    if (error.response?.status === 403) {
      console.log('❌ Still out of quota - will check again in 5 minutes');
      return false; // Continue monitoring
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false; // Continue monitoring
    }
  }
}

async function startMonitoring() {
  console.log('Starting Devin quota monitoring...');
  console.log('Will check every 5 minutes and auto-execute handoff when quota resets.');
  console.log('Press Ctrl+C to stop monitoring.');
  console.log('');

  while (true) {
    const shouldStop = await checkAndExecute();
    
    if (shouldStop) {
      console.log('✅ Handoff executed - stopping monitor');
      break;
    }

    // Wait for next check
    console.log('Waiting 5 minutes before next check...');
    console.log('');
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring().catch(error => {
    console.error('Monitor failed:', error);
    process.exit(1);
  });
}

module.exports = { checkAndExecute };