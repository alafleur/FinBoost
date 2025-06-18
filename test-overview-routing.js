// Test script to verify Overview tab lesson routing

async function testOverviewRouting() {
  console.log('🔄 Testing Overview Tab Lesson Routing...');
  
  try {
    // First, get available modules
    const modulesResponse = await fetch('http://localhost:5000/api/modules');
    const modulesData = await modulesResponse.json();
    
    if (!modulesData.success || !modulesData.modules.length) {
      console.log('❌ No modules available for testing');
      return;
    }
    
    const testModule = modulesData.modules[0]; // Use first module
    console.log(`📚 Testing with module: ${testModule.title} (ID: ${testModule.id})`);
    
    // Test the lesson route that Dashboard Overview tab uses
    const lessonUrl = `http://localhost:5000/lesson/${testModule.id}`;
    console.log(`🔗 Testing route: /lesson/${testModule.id}`);
    
    const lessonResponse = await fetch(lessonUrl);
    console.log(`📊 Response status: ${lessonResponse.status}`);
    
    if (lessonResponse.status === 200) {
      const content = await lessonResponse.text();
      if (content.includes('<!DOCTYPE html>') && !content.includes('404')) {
        console.log('✅ Lesson route is working correctly');
        console.log('   The issue may be with client-side routing or module data');
      } else {
        console.log('❌ Lesson route returned unexpected content');
      }
    } else {
      console.log(`❌ Lesson route failed with status: ${lessonResponse.status}`);
    }
    
    // Test what happens with education route (from screenshot)
    const educationUrl = `http://localhost:5000/education/${testModule.id}`;
    console.log(`🔗 Testing incorrect route: /education/${testModule.id}`);
    
    const educationResponse = await fetch(educationUrl);
    console.log(`📊 Education route status: ${educationResponse.status}`);
    
    if (educationResponse.status === 404) {
      console.log('✅ Education route correctly returns 404 (as expected)');
      console.log('   This confirms the screenshot shows an incorrect URL');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOverviewRouting();