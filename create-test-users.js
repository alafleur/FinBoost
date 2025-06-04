import { pool } from './server/db.js';
import bcrypt from 'bcryptjs';

// Realistic first and last names for test users
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
  'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
  'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
  'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah', 'Timothy', 'Dorothy',
  'Ronald', 'Lisa', 'Jason', 'Nancy', 'Edward', 'Karen', 'Jeffrey', 'Betty', 'Ryan', 'Helen',
  'Jacob', 'Sandra', 'Gary', 'Donna', 'Nicholas', 'Carol', 'Eric', 'Ruth', 'Jonathan', 'Sharon',
  'Stephen', 'Michelle', 'Larry', 'Laura', 'Justin', 'Sarah', 'Scott', 'Kimberly', 'Brandon', 'Deborah'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
];

function generateRandomUser(index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`;
  const email = `${username}@testuser.com`;
  
  // Generate realistic points (0-500 range with normal distribution)
  const basePoints = Math.floor(Math.random() * 500);
  const currentMonthPoints = Math.floor(Math.random() * 100);
  const totalPoints = basePoints + currentMonthPoints;
  
  // Determine tier based on points (rough distribution)
  let tier = 1; // Default to tier 1
  if (totalPoints >= 150) tier = 3;
  else if (totalPoints >= 50) tier = 2;
  
  // Generate streaks
  const currentStreak = Math.floor(Math.random() * 30);
  const longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 50));
  
  return {
    username,
    email,
    firstName,
    lastName,
    password: 'testpass123', // Simple password for test users
    totalPoints,
    currentMonthPoints,
    tier,
    currentStreak,
    longestStreak
  };
}

async function createTestUsers() {
  try {
    console.log('Creating 100 test users...');
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('testpass123', saltRounds);
    
    for (let i = 1; i <= 100; i++) {
      const user = generateRandomUser(i);
      
      try {
        await pool.query(`
          INSERT INTO users (
            username, email, password_hash, first_name, last_name, 
            total_points, current_month_points, tier, current_streak, longest_streak
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          user.username,
          user.email,
          hashedPassword,
          user.firstName,
          user.lastName,
          user.totalPoints,
          user.currentMonthPoints,
          user.tier,
          user.currentStreak,
          user.longestStreak
        ]);
        
        if (i % 10 === 0) {
          console.log(`Created ${i} users...`);
        }
      } catch (error) {
        console.log(`Skipping user ${user.username} (likely already exists)`);
      }
    }
    
    console.log('Successfully created test users!');
    
    // Show summary
    const result = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`Total users in database: ${result.rows[0].total}`);
    
    // Show tier distribution
    const tierStats = await pool.query(`
      SELECT tier, COUNT(*) as count 
      FROM users 
      GROUP BY tier 
      ORDER BY tier
    `);
    
    console.log('\nTier distribution:');
    tierStats.rows.forEach(row => {
      console.log(`Tier ${row.tier}: ${row.count} users`);
    });
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await pool.end();
  }
}

createTestUsers();