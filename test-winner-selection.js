import fetch from 'node-fetch';

async function testWinnerSelection() {
  const baseUrl = 'http://localhost:5000';
  
  // First, let's login as admin to get a token
  console.log('🔐 Logging in as admin...');
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'lafleur.andrew@gmail.com',
      password: 'admin123456'
    })
  });
  
  const loginData = await loginResponse.json();
  if (!loginData.success) {
    console.error('❌ Login failed:', loginData.message);
    return;
  }
  
  const token = loginData.token;
  console.log('✅ Admin login successful');
  
  // Get current users to see the pool
  console.log('\n📊 Checking current user pool...');
  const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const usersData = await usersResponse.json();
  
  if (usersData.success) {
    const premiumUsers = usersData.users.filter(u => u.subscriptionStatus === 'active');
    console.log(`Total premium users: ${premiumUsers.length}`);
    
    // Show tier distribution
    const usersByTier = {
      tier1: premiumUsers.filter(u => (u.currentMonthPoints || 0) >= 100),
      tier2: premiumUsers.filter(u => (u.currentMonthPoints || 0) >= 50 && (u.currentMonthPoints || 0) < 100),
      tier3: premiumUsers.filter(u => (u.currentMonthPoints || 0) < 50)
    };
    
    console.log(`Tier 1 (100+ points): ${usersByTier.tier1.length} users`);
    console.log(`Tier 2 (50-99 points): ${usersByTier.tier2.length} users`);
    console.log(`Tier 3 (0-49 points): ${usersByTier.tier3.length} users`);
  }
  
  // Create a test winner cycle
  console.log('\n🎯 Creating test winner cycle...');
  const cycleResponse = await fetch(`${baseUrl}/api/admin/winner-cycles/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      cycleName: 'Test Winner Selection - January 2024',
      cycleStartDate: '2024-01-01',
      cycleEndDate: '2024-01-31',
      poolSettings: { testMode: true, selectionPercentage: 50 }
    })
  });
  
  const cycleData = await cycleResponse.json();
  if (!cycleData.success) {
    console.error('❌ Failed to create cycle:', cycleData.error);
    return;
  }
  
  const cycleId = cycleData.cycle.id;
  console.log(`✅ Created cycle with ID: ${cycleId}`);
  
  // Run random selection
  console.log('\n🎲 Running random winner selection...');
  const selectionResponse = await fetch(`${baseUrl}/api/admin/winner-cycles/${cycleId}/run-selection`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const selectionData = await selectionResponse.json();
  if (!selectionData.success) {
    console.error('❌ Selection failed:', selectionData.error);
    return;
  }
  
  console.log('✅ Random selection completed!');
  console.log('Results:', JSON.stringify(selectionData.results, null, 2));
  
  // Get the winners
  console.log('\n🏆 Fetching selected winners...');
  const winnersResponse = await fetch(`${baseUrl}/api/admin/winner-cycles/${cycleId}/winners`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const winnersData = await winnersResponse.json();
  if (winnersData.success) {
    console.log('Selected Winners by Tier:');
    
    ['tier1', 'tier2', 'tier3'].forEach(tier => {
      console.log(`\n${tier.toUpperCase()}:`);
      if (winnersData.winners[tier] && winnersData.winners[tier].length > 0) {
        winnersData.winners[tier].forEach(winner => {
          console.log(`  Rank ${winner.tierRank}: ${winner.username} (${winner.email})`);
        });
      } else {
        console.log('  No winners selected');
      }
    });
  }
  
  // Test CSV export
  console.log('\n📄 Testing CSV export...');
  const exportResponse = await fetch(`${baseUrl}/api/admin/winner-cycles/${cycleId}/export`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (exportResponse.ok) {
    const csvContent = await exportResponse.text();
    console.log('✅ CSV export successful');
    console.log('CSV Content:');
    console.log(csvContent);
  }
  
  // Test percentage allocation
  console.log('\n💰 Testing percentage allocation...');
  const testUpdates = [];
  
  // Add sample percentage updates if we have winners
  if (winnersData.success) {
    ['tier1', 'tier2', 'tier3'].forEach(tier => {
      if (winnersData.winners[tier] && winnersData.winners[tier].length > 0) {
        winnersData.winners[tier].forEach((winner, index) => {
          // Distribute percentages: first winner gets more
          const percentage = index === 0 ? 60 : Math.floor(40 / (winnersData.winners[tier].length - 1));
          testUpdates.push({
            winnerId: winner.id,
            rewardPercentage: percentage
          });
        });
      }
    });
  }
  
  if (testUpdates.length > 0) {
    const updateResponse = await fetch(`${baseUrl}/api/admin/winner-cycles/${cycleId}/update-percentages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ updates: testUpdates })
    });
    
    const updateData = await updateResponse.json();
    if (updateData.success) {
      console.log('✅ Percentage allocation test successful');
    } else {
      console.log('❌ Percentage allocation failed:', updateData.error);
    }
  }
  
  console.log('\n🎉 Winner selection system test completed!');
}

testWinnerSelection().catch(console.error);