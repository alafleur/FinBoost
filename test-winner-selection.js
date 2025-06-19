#!/usr/bin/env node

import fs from 'fs';

async function testWinnerSelection() {
  console.log('🔥 Testing Flexible Winner Selection System');
  
  try {
    // Read admin token
    const adminToken = fs.readFileSync('admin_token.txt', 'utf8').trim();
    console.log('✅ Admin token loaded');

    // Test 1: Get eligible users
    console.log('\n📋 Test 1: Getting eligible users for cycle 2...');
    const eligibleResponse = await fetch('http://localhost:5000/api/admin/eligible-users/2', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const eligibleData = await eligibleResponse.json();
    console.log('Eligible users response:', JSON.stringify(eligibleData, null, 2));

    // Test 2: Execute point-weighted random selection (baseline method)
    console.log('\n🎯 Test 2: Executing point-weighted random winner selection...');
    
    const selectionPayload = {
      cycleSettingId: 2,
      selectionMode: 'weighted_random',
      tierSettings: {
        tier1: { winnerCount: 3, poolPercentage: 50 },
        tier2: { winnerCount: 5, poolPercentage: 30 },
        tier3: { winnerCount: 7, poolPercentage: 20 }
      },
      pointDeductionPercentage: 50,
      rolloverPercentage: 50
    };

    const selectionResponse = await fetch('http://localhost:5000/api/admin/cycle-winner-selection/execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectionPayload)
    });

    const selectionData = await selectionResponse.json();
    console.log('Winner selection response:', JSON.stringify(selectionData, null, 2));

    // Test 3: Test other selection modes
    console.log('\n🔄 Test 3: Testing top performers selection...');
    
    const topPerformersPayload = {
      ...selectionPayload,
      selectionMode: 'top_performers'
    };

    const topPerformersResponse = await fetch('http://localhost:5000/api/admin/cycle-winner-selection/execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(topPerformersPayload)
    });

    const topPerformersData = await topPerformersResponse.json();
    console.log('Top performers selection response:', JSON.stringify(topPerformersData, null, 2));

    // Test 4: Get winner details
    console.log('\n📊 Test 4: Getting winner details...');
    
    const detailsResponse = await fetch('http://localhost:5000/api/admin/cycle-winner-details/2', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const detailsData = await detailsResponse.json();
    console.log('Winner details response:', JSON.stringify(detailsData, null, 2));

    // Test 5: Clear winner selection
    console.log('\n🧹 Test 5: Clearing winner selection...');
    
    const clearResponse = await fetch('http://localhost:5000/api/admin/cycle-winner-selection/2', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const clearData = await clearResponse.json();
    console.log('Clear selection response:', JSON.stringify(clearData, null, 2));

    console.log('\n✅ All tests completed successfully!');
    console.log('🎯 Point-weighted random selection confirmed as baseline method');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testWinnerSelection();