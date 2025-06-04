
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  const { db } = require('./server/db');
  const { users } = require('./shared/schema');
  
  // Helper function to generate random data
  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const firstNames = [
    'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isabella', 'Jack',
    'Katherine', 'Liam', 'Maya', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Samuel', 'Taylor',
    'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zachary', 'Aria', 'Blake', 'Chloe', 'Dylan',
    'Ethan', 'Fiona', 'Gabriel', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Mason', 'Nora',
    'Owen', 'Penelope', 'Quincy', 'Ruby', 'Sebastian', 'Tessa', 'Ulysses', 'Violet', 'William', 'Zoe'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
  ];
  
  const occupations = [
    'Software Engineer', 'Teacher', 'Nurse', 'Accountant', 'Marketing Manager', 'Sales Representative',
    'Data Scientist', 'Mechanic', 'Chef', 'Lawyer', 'Doctor', 'Financial Advisor', 'Graphic Designer',
    'Police Officer', 'Firefighter', 'Pharmacist', 'Dentist', 'Architect', 'Electrician', 'Plumber',
    'Real Estate Agent', 'Photographer', 'Writer', 'Journalist', 'Student', 'Retired', 'Consultant',
    'Project Manager', 'HR Manager', 'Operations Manager', 'Business Analyst', 'Web Developer',
    'Social Worker', 'Therapist', 'Veterinarian', 'Pilot', 'Construction Worker', 'Farmer', 'Scientist'
  ];
  
  const locations = [
    'Toronto, ON', 'Vancouver, BC', 'Montreal, QC', 'Calgary, AB', 'Edmonton, AB', 'Ottawa, ON',
    'Winnipeg, MB', 'Quebec City, QC', 'Hamilton, ON', 'Kitchener, ON', 'London, ON', 'Halifax, NS',
    'Victoria, BC', 'Windsor, ON', 'Oshawa, ON', 'Saskatoon, SK', 'Regina, SK', 'Sherbrooke, QC',
    'St. John\'s, NL', 'Barrie, ON', 'Kelowna, BC', 'Abbotsford, BC', 'Greater Sudbury, ON',
    'Kingston, ON', 'Saguenay, QC', 'Trois-Rivières, QC', 'Guelph, ON', 'Cambridge, ON',
    'Whitby, ON', 'Ajax, ON', 'Langley, BC', 'Saanich, BC', 'Milton, ON', 'Coquitlam, BC',
    'Richmond, BC', 'Richmond Hill, ON', 'Oakville, ON', 'Burlington, ON', 'Markham, ON'
  ];
  
  const bios = [
    'Just starting my financial journey', 'Learning to invest better', 'Financial planning enthusiast',
    'Saving for retirement', 'Building my emergency fund', 'Paying off debt', 'Investing in my future',
    'Learning about personal finance', 'On a mission to financial freedom', 'Consistent daily learner',
    'Helping others with their finances', 'Building wealth slowly', 'Teaching my kids about money',
    'Planning for early retirement', 'Real estate investor', 'Stock market enthusiast',
    'Budgeting expert', 'Side hustle entrepreneur', 'Crypto curious', 'Value investor',
    'Living below my means', 'Building passive income', 'Financial literacy advocate',
    'Debt-free journey', 'First-time homebuyer', 'College savings planner'
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);
  const testUsers = [];
  
  // Generate 100 users
  for (let i = 1; i <= 100; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}${i}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.com`;
    
    // Distribute users across tiers with realistic proportions
    let tier, totalPoints, currentMonthPoints;
    const tierRand = Math.random();
    
    if (tierRand < 0.6) { // 60% Bronze
      tier = 'tier1';
      totalPoints = getRandomInt(0, 999);
      currentMonthPoints = getRandomInt(0, Math.min(500, totalPoints));
    } else if (tierRand < 0.85) { // 25% Silver  
      tier = 'tier2';
      totalPoints = getRandomInt(1000, 2999);
      currentMonthPoints = getRandomInt(300, 1500);
    } else { // 15% Gold
      tier = 'tier3';
      totalPoints = getRandomInt(3000, 8000);
      currentMonthPoints = getRandomInt(800, 3000);
    }
    
    const currentStreak = getRandomInt(0, 50);
    const longestStreak = Math.max(currentStreak, getRandomInt(currentStreak, currentStreak + 30));
    
    const joinDaysAgo = getRandomInt(1, 365);
    const lastLoginDaysAgo = getRandomInt(0, 7);
    
    testUsers.push({
      email,
      username,
      firstName,
      lastName,
      totalPoints,
      currentMonthPoints,
      tier,
      currentStreak,
      longestStreak,
      bio: getRandomElement(bios),
      location: getRandomElement(locations),
      occupation: getRandomElement(occupations),
      password: hashedPassword,
      isActive: true,
      joinedAt: new Date(Date.now() - joinDaysAgo * 24 * 60 * 60 * 1000),
      lastLoginAt: new Date(Date.now() - lastLoginDaysAgo * 24 * 60 * 60 * 1000),
      lastActivityDate: new Date(Date.now() - getRandomInt(0, 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }
  
  try {
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const userData of testUsers) {
      try {
        const [user] = await db.insert(users).values(userData).returning();
        console.log(`✅ Created user ${createdCount + 1}: ${user.email} (${user.tier}, ${user.totalPoints} points)`);
        createdCount++;
      } catch (error) {
        if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
          console.log(`⚠️  Skipped duplicate: ${userData.email}`);
          skippedCount++;
        } else {
          console.error(`❌ Error creating ${userData.email}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 User creation complete!`);
    console.log(`✅ Created: ${createdCount} users`);
    console.log(`⚠️  Skipped: ${skippedCount} duplicates`);
    console.log(`\nLogin credentials for all users:`);
    console.log(`Password: password123`);
    console.log(`\nTier distribution:`);
    console.log(`- Bronze (tier1): ~60 users`);
    console.log(`- Silver (tier2): ~25 users`);  
    console.log(`- Gold (tier3): ~15 users`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
  
  process.exit(0);
}

createTestUsers();
