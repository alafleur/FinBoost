
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const newPassword = 'admin123456'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'lafleur.andrew@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log('📧 Email: lafleur.andrew@gmail.com');
      console.log('🔑 New password:', newPassword);
      console.log('🆔 User ID:', result.rows[0].id);
    } else {
      console.log('❌ User not found with email: lafleur.andrew@gmail.com');
    }
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
