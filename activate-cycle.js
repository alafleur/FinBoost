import fetch from 'node-fetch';

async function activateCycle() {
  // Login as admin
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lafleur.andrew@gmail.com', password: 'admin123456' })
  });
  const { token } = await loginResponse.json();

  // Get cycles
  const cyclesResponse = await fetch('http://localhost:5000/api/admin/cycle-settings', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { cycles } = await cyclesResponse.json();
  
  if (cycles && cycles.length > 0) {
    // Activate first cycle
    const updateResponse = await fetch(`http://localhost:5000/api/admin/cycle-settings/${cycles[0].id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...cycles[0], isActive: true })
    });
    
    const result = await updateResponse.json();
    console.log('Cycle activated:', result.success ? 'Success' : 'Failed');
  }
}

activateCycle();