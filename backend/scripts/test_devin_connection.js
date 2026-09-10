/**
 * Test Devin API connection status
 * Run this periodically to check when quota resets
 * Usage: node scripts/test_devin_connection.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const devinService = require('../src/services/devinService');

async function testConnection() {
  console.log('=== Devin Connection Test ===');
  console.log('Time:', new Date().toISOString());
  console.log('');

  const status = devinService.getStatus();
  
  console.log('Configuration Status:');
  console.log('  Enabled:', status.enabled);
  console.log('  Has API Key:', status.hasApiKey);
  console.log('  Configured:', status.configured);
  console.log('  Active Sessions:', status.sessionsActive);
  console.log('');

  if (!status.configured) {
    console.log('❌ Devin is not properly configured');
    console.log('Set DEVIN_ENABLED=true and DEVIN_API_KEY in backend/.env');
    return false;
  }

  console.log('Testing API connection...');
  
  try {
    // Try a simple API call to test quota
    const axios = require('axios');
    const testPayload = {
      prompt: "Connection test",
      title: "Test Session",
      tags: ["test"]
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

    console.log('✅ Connection successful!');
    console.log('Response Status:', response.status);
    console.log('Quota Status: AVAILABLE');
    
    // Clean up test session if possible
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
        console.log('Test session cleaned up');
      } catch (cleanupError) {
        console.log('Note: Could not clean up test session (non-critical)');
      }
    }

    return true;

  } catch (error) {
    console.log('❌ Connection failed');
    
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Detail:', error.response.data?.detail || error.response.statusText);
      
      if (error.response.status === 403) {
        console.log('');
        console.log('🔒 QUOTA ISSUE DETECTED');
        console.log('The Devin API key has exceeded quota limits.');
        console.log('');
        console.log('RESOLUTION OPTIONS:');
        console.log('1. Contact Devin Support: https://devin.ai/dashboard → Support');
        console.log('2. Upgrade Plan: https://devin.ai/dashboard → Billing → Upgrade');
        console.log('3. Wait for auto-reset: Sept 10, 2026 @ 1:30 PM IST');
        console.log('');
        console.log('See DEVIN_QUOTA_RESOLUTION_GUIDE.md for detailed steps.');
      } else if (error.response.status === 429) {
        console.log('');
        console.log('⚠️ RATE LIMIT EXCEEDED');
        console.log('Too many requests. Wait a few minutes and try again.');
      } else if (error.response.status === 401) {
        console.log('');
        console.log('🔑 AUTHENTICATION ERROR');
        console.log('API key is invalid or expired.');
        console.log('Generate a new key at: https://devin.ai/dashboard → API Keys');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused - check internet connection');
    } else {
      console.log('Error:', error.message);
    }

    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    console.log('');
    console.log('=== Test Complete ===');
    console.log('Result:', success ? '✅ READY FOR INTEGRATION' : '❌ NOT READY');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with exception:', error.message);
    process.exit(1);
  });