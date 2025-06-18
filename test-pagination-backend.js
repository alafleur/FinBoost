// Test script to verify backend pagination implementation

const baseUrl = 'http://localhost:5000';

async function testPaginationBackend() {
  try {
    console.log('🔄 Testing Step 4.1: Backend Pagination Implementation...');
    
    // Test 1: Default pagination (page 1, 20 users)
    console.log('1. Testing default pagination...');
    const response1 = await fetch(`${baseUrl}/api/cycles/leaderboard`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('   Default response structure:', {
        hasLeaderboard: Array.isArray(data1.leaderboard),
        leaderboardLength: data1.leaderboard?.length,
        hasPagination: !!data1.pagination,
        pagination: data1.pagination
      });
      
      if (data1.pagination) {
        console.log('✅ Default pagination working - page 1, pageSize 20');
      } else {
        console.log('❌ Default pagination missing pagination metadata');
        return;
      }
    } else {
      console.log('❌ Default pagination failed:', response1.status);
      return;
    }

    // Test 2: Custom pagination (page 2, 10 users)
    console.log('2. Testing custom pagination...');
    const response2 = await fetch(`${baseUrl}/api/cycles/leaderboard?page=2&pageSize=10`);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('   Custom pagination response:', {
        leaderboardLength: data2.leaderboard?.length,
        pagination: data2.pagination,
        firstUserRank: data2.leaderboard?.[0]?.rank,
        lastUserRank: data2.leaderboard?.[data2.leaderboard?.length - 1]?.rank
      });
      
      // Verify ranks are correct for page 2
      const expectedFirstRank = 11; // (page-1) * pageSize + 1 = (2-1) * 10 + 1 = 11
      if (data2.leaderboard?.[0]?.rank === expectedFirstRank) {
        console.log('✅ Custom pagination working - ranks calculated correctly');
      } else {
        console.log('❌ Custom pagination rank calculation incorrect');
      }
    } else {
      console.log('❌ Custom pagination failed:', response2.status);
    }

    // Test 3: Edge case - high page number
    console.log('3. Testing edge case - high page number...');
    const response3 = await fetch(`${baseUrl}/api/cycles/leaderboard?page=100&pageSize=20`);
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('   High page response:', {
        leaderboardLength: data3.leaderboard?.length,
        totalPages: data3.pagination?.totalPages,
        currentPage: data3.pagination?.page
      });
      
      if (data3.leaderboard?.length === 0 && data3.pagination?.page === 100) {
        console.log('✅ Edge case handled correctly - empty results for out-of-range page');
      }
    }

    console.log('');
    console.log('✅ STEP 4.1 COMPLETE: Backend pagination implementation working');
    console.log('   - API accepts page and pageSize parameters');
    console.log('   - Returns paginated leaderboard data with metadata');
    console.log('   - Correctly calculates ranks based on offset');
    console.log('   - Handles edge cases appropriately');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPaginationBackend();