
const { Pool } = require('@neondatabase/serverless');

async function deleteUser() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    
    // First, find the user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['lafleur.andrew@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('User with email lafleur.andrew@gmail.com not found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Delete all related records first
    console.log('Deleting user points history...');
    await pool.query('DELETE FROM user_points_history WHERE user_id = $1', [userId]);
    
    console.log('Deleting user progress...');
    await pool.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);
    
    console.log('Deleting user referral codes...');
    await pool.query('DELETE FROM user_referral_codes WHERE user_id = $1', [userId]);
    
    console.log('Deleting referrals...');
    await pool.query('DELETE FROM referrals WHERE referrer_user_id = $1 OR referred_user_id = $1', [userId]);
    
    console.log('Deleting user monthly rewards...');
    await pool.query('DELETE FROM user_monthly_rewards WHERE user_id = $1', [userId]);
    
    console.log('Deleting password reset tokens...');
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    
    // Finally delete the user
    console.log('Deleting user...');
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    console.log(`Successfully deleted user: lafleur.andrew@gmail.com`);
    
  } catch (error) {
    console.error('Error deleting user:', error.message);
  } finally {
    await pool.end();
  }
}

deleteUser();
