const jwt = require('jsonwebtoken');
const { db } = require('./server/db');
const { users } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function testAdminAuth() {
  try {
    // Test JWT token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1MTM4NjY4MCwiZXhwIjoxNzUxNDczMDgwfQ.u1DblwpI_ta42hZDqeJEuOVQ90_8esNfqmk4FKt3OO4';
    
    console.log('Testing JWT token verification...');
    const decoded = jwt.verify(token, 'finboost-secret-key-2024');
    console.log('✅ Token decoded successfully:', decoded);
    
    // Test database query
    console.log('\nTesting database query...');
    const [userResult] = await db.select().from(users).where(eq(users.id, decoded.userId));
    console.log('✅ User from database:', {
      id: userResult.id,
      email: userResult.email,
      username: userResult.username,
      isAdmin: userResult.isAdmin
    });
    
    // Test admin check
    if (userResult && userResult.isAdmin) {
      console.log('✅ User has admin privileges');
    } else {
      console.log('❌ User does not have admin privileges');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

testAdminAuth();