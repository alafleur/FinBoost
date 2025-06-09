// Test modules API response
async function testModulesAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/modules');
    const data = await response.json();
    
    console.log('Modules API Response Structure:');
    console.log('Success:', data.success);
    console.log('Total modules:', data.modules.length);
    
    // Check first few modules for accessType field
    data.modules.slice(0, 5).forEach(module => {
      console.log(`Module: ${module.title}`);
      console.log(`  ID: ${module.id}`);
      console.log(`  AccessType: ${module.accessType}`);
      console.log(`  Has accessType field: ${module.hasOwnProperty('accessType')}`);
      console.log('---');
    });
    
    // Find Credit Management specifically
    const creditModule = data.modules.find(m => m.title === 'Credit Management');
    if (creditModule) {
      console.log('Credit Management Module:');
      console.log('  AccessType:', creditModule.accessType);
      console.log('  All fields:', Object.keys(creditModule));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testModulesAPI();