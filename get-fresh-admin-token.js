import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

async function getFreshAdminToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lafleur.andrew@gmail.com',
        password: 'admin123456'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      fs.writeFileSync('fresh_admin_token.txt', data.token);
      console.log('✅ Fresh admin token saved to fresh_admin_token.txt');
      return data.token;
    } else {
      console.error('❌ Login failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting token:', error.message);
    return null;
  }
}

getFreshAdminToken();