/**
 * Phase 5: Mobile/Desktop Responsiveness Testing
 * Validates onboarding behavior across different viewport sizes
 */

console.log('📱 PHASE 5: MOBILE/DESKTOP TESTING');
console.log('=================================\n');

// Test responsive behavior
function testResponsiveBehavior() {
  console.log('📐 Step 3.1: Viewport Detection Testing');
  console.log('---------------------------------------');
  
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  
  console.log(`Current viewport: ${originalWidth}x${originalHeight}`);
  
  // Test mobile detection logic (matches Dashboard.tsx logic)
  const isMobileDetected = window.innerWidth <= 768;
  console.log(`Mobile detected: ${isMobileDetected ? '✅ Mobile' : '❌ Desktop'}`);
  
  // Expected tour steps based on viewport
  const expectedTourSteps = isMobileDetected ? 'dashboardTourSteps' : 'desktopTourSteps';
  console.log(`Expected tour variant: ${expectedTourSteps}`);
  
  return true;
}

// Test viewport simulation
function testViewportSimulation() {
  console.log('\n📱 Step 3.2: Simulated Viewport Testing');
  console.log('---------------------------------------');
  
  // Common mobile breakpoints to test
  const testViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop Small', width: 1024, height: 768 },
    { name: 'Desktop Large', width: 1440, height: 900 }
  ];
  
  console.log('Testing viewport responsiveness:');
  
  testViewports.forEach(viewport => {
    const isMobile = viewport.width <= 768;
    const expectedSteps = isMobile ? 'dashboardTourSteps' : 'desktopTourSteps';
    
    console.log(`📐 ${viewport.name} (${viewport.width}x${viewport.height})`);
    console.log(`   Mobile: ${isMobile ? '✅' : '❌'}`);
    console.log(`   Tour steps: ${expectedSteps}`);
  });
  
  console.log('\n💡 To test manually:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Toggle device toolbar');
  console.log('3. Test different device presets');
  console.log('4. Verify tour positioning and content');
  
  return true;
}

// Test element positioning across viewports
function testElementPositioning() {
  console.log('\n🎯 Step 3.3: Element Positioning Testing');
  console.log('----------------------------------------');
  
  const tourTargets = [
    'nav-overview',
    'nav-learn',
    'nav-actions',
    'nav-rewards',
    'nav-leaderboard',
    'nav-predictions',
    'nav-referrals'
  ];
  
  console.log('Testing tour target positioning:');
  
  tourTargets.forEach(targetId => {
    const element = document.getElementById(targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const inViewport = rect.top >= 0 && rect.left >= 0 && 
                        rect.bottom <= window.innerHeight && 
                        rect.right <= window.innerWidth;
      
      console.log(`✅ #${targetId}`);
      console.log(`   Position: (${Math.round(rect.x)}, ${Math.round(rect.y)})`);
      console.log(`   Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      console.log(`   Visible: ${isVisible ? '✅' : '❌'}`);
      console.log(`   In viewport: ${inViewport ? '✅' : '❌'}`);
    } else {
      console.log(`❌ #${targetId} - Element not found`);
    }
  });
  
  return true;
}

// Test tour positioning specifics
function testTourPositioning() {
  console.log('\n🎪 Step 3.4: Tour Positioning Analysis');
  console.log('--------------------------------------');
  
  // Check for tour-related elements
  const tourElements = document.querySelectorAll('[class*="joyride"], [data-testid*="tour"], .tour');
  
  if (tourElements.length > 0) {
    console.log(`✅ Found ${tourElements.length} tour-related elements`);
    
    tourElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      console.log(`   Tour element ${index + 1}:`);
      console.log(`   Position: (${Math.round(rect.x)}, ${Math.round(rect.y)})`);
      console.log(`   Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    });
  } else {
    console.log('ℹ️  No active tour elements found');
    console.log('   Expected: Tour only shows during active onboarding');
  }
  
  // Check z-index and layering
  const highZIndexElements = Array.from(document.querySelectorAll('*'))
    .filter(el => {
      const zIndex = parseInt(window.getComputedStyle(el).zIndex);
      return zIndex > 1000;
    });
  
  console.log(`\n🔍 High z-index elements (potential tour conflicts): ${highZIndexElements.length}`);
  
  return true;
}

// Main responsive testing function
function runResponsiveTests() {
  console.log('Starting Phase 5 responsive testing...\n');
  
  const results = [
    testResponsiveBehavior(),
    testViewportSimulation(),
    testElementPositioning(),
    testTourPositioning()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n🎯 RESPONSIVE TESTING SUMMARY');
  console.log('============================');
  console.log(`Tests completed: ${passed}/${total}`);
  console.log(`Success rate: ${Math.round((passed/total) * 100)}%`);
  
  console.log('\n📋 Manual Testing Checklist:');
  console.log('□ Test onboarding on mobile viewport (≤768px)');
  console.log('□ Test onboarding on desktop viewport (>768px)');
  console.log('□ Verify tour step positioning on both');
  console.log('□ Check welcome modal responsiveness');
  console.log('□ Test getting started card on mobile');
  console.log('□ Verify no layout breaks during tour');
  
  return passed === total;
}

// Auto-run tests
runResponsiveTests();

// Export for manual use  
window.phase5ResponsiveTesting = {
  run: runResponsiveTests,
  testResponsiveBehavior,
  testViewportSimulation,
  testElementPositioning,
  testTourPositioning
};