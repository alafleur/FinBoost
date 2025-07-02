async function enrollUsersInTest1Cycle() {
  console.log('=== ENROLLING PREMIUM USERS IN TEST1 CYCLE ===\n');

  try {
    // Login as admin
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lafleur.andrew@gmail.com',
        password: 'admin123456'
      })
    });
    
    const loginData = await loginResponse.json();
    const adminToken = loginData.token;
    console.log('✓ Admin login successful');

    // Get Test1 cycle ID
    const cyclesResponse = await fetch('http://localhost:5000/api/admin/cycle-settings', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const cycles = await cyclesResponse.json();
    const test1Cycle = cycles.find(c => c.cycleName === 'Test1');
    
    if (!test1Cycle) {
      console.log('❌ Test1 cycle not found');
      return;
    }
    
    console.log(`✓ Found Test1 cycle (ID: ${test1Cycle.id})`);

    // Enroll premium users in Test1 cycle
    const enrollResponse = await fetch(`http://localhost:5000/api/admin/cycles/${test1Cycle.id}/enroll-premium-users`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (enrollResponse.ok) {
      const enrollResult = await enrollResponse.json();
      console.log('✓ Premium user enrollment completed:');
      console.log(`  - Success: ${enrollResult.success} users`);
      console.log(`  - Errors: ${enrollResult.errors} users`);
      console.log(`  - Message: ${enrollResult.message}`);
    } else {
      console.log('❌ Premium user enrollment failed');
      console.log('Response:', await enrollResponse.text());
    }

    // Verify enrollment by checking user cycle points
    const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const usersData = await usersResponse.json();
    const premiumUsers = usersData.users.filter(u => u.subscriptionStatus === 'premium').slice(0, 5);
    
    console.log('\n📊 Verification - Sample user cycle enrollment:');
    
    for (const user of premiumUsers) {
      try {
        const userPointsResponse = await fetch(`http://localhost:5000/api/user/cycle-points/${test1Cycle.id}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (userPointsResponse.ok) {
          const userPoints = await userPointsResponse.json();
          console.log(`  ✓ ${user.username}: Enrolled with ${userPoints.points || 0} points`);
        } else {
          console.log(`  ❌ ${user.username}: Not enrolled`);
        }
      } catch (error) {
        console.log(`  ❌ ${user.username}: Error checking enrollment`);
      }
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Add sample points to users for meaningful tier testing');
    console.log('2. Run tier recalculation to update percentile thresholds');
    console.log('3. Test leaderboard and dashboard display');

  } catch (error) {
    console.error('❌ Enrollment failed:', error.message);
  }
}

enrollUsersInTest1Cycle();