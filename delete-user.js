
const { db } = require('./server/db');
const { users, userPointsHistory, userProgress, userReferralCodes, referrals, userMonthlyRewards, passwordResetTokens } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function deleteUser(email) {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // First, get the user to find their ID
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      console.log('User not found');
      return;
    }
    
    const userId = user[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Delete related records first (foreign key constraints)
    console.log('Deleting user points history...');
    await db.delete(userPointsHistory).where(eq(userPointsHistory.userId, userId));
    
    console.log('Deleting user progress...');
    await db.delete(userProgress).where(eq(userProgress.userId, userId));
    
    console.log('Deleting user referral codes...');
    await db.delete(userReferralCodes).where(eq(userReferralCodes.userId, userId));
    
    console.log('Deleting referrals where user was referrer...');
    await db.delete(referrals).where(eq(referrals.referrerUserId, userId));
    
    console.log('Deleting referrals where user was referred...');
    await db.delete(referrals).where(eq(referrals.referredUserId, userId));
    
    console.log('Deleting user monthly rewards...');
    await db.delete(userMonthlyRewards).where(eq(userMonthlyRewards.userId, userId));
    
    console.log('Deleting password reset tokens...');
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    
    // Finally, delete the user
    console.log('Deleting user...');
    await db.delete(users).where(eq(users.id, userId));
    
    console.log(`Successfully deleted user: ${email}`);
    
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

// Delete the specific user
deleteUser('lafleur.andrew@gmail.com');
