#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function createTestUser() {
  console.log('Creating test user for Phase 5...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'phase5testuser',
        email: 'phase5test@example.com',
        password: 'testpass123'
      })
    });
    
    const data = await response.json();
    if (data.success || data.token) {
      console.log('✅ Test user created successfully');
      return true;
    } else {
      console.log('User might already exist or creation failed:', data.message);
      return true; // Might already exist
    }
  } catch (error) {
    console.log('Error creating test user:', error.message);
    return false;
  }
}

createTestUser();