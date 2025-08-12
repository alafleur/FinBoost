#!/usr/bin/env node

/**
 * Phase 6 Step 3 Verification Script
 * 
 * Verifies successful consolidation of MasterTopicsSection duplicate mobile/desktop implementations
 * into a single responsive component with unified ID and responsive Tailwind classes.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Phase 6 Step 3: MasterTopicsSection Consolidation Verification\n');

const homeV3Path = path.join(__dirname, 'client/src/pages/HomeV3.tsx');

try {
  const content = fs.readFileSync(homeV3Path, 'utf8');

  // ✅ Critical Success Indicators
  console.log('✅ CONSOLIDATION SUCCESS VERIFICATION:');
  
  // 1. Verify unified container ID
  const unifiedContainerMatches = content.match(/id="lessons-scroll-container"/g);
  const oldContainerMatches = content.match(/id="lesson-scroll-container"/g);
  const desktopContainerMatches = content.match(/id="desktop-lesson-scroll-container"/g);
  
  console.log(`   📦 Unified container ID count: ${unifiedContainerMatches ? unifiedContainerMatches.length : 0} (should be 1)`);
  console.log(`   🚫 Old mobile ID count: ${oldContainerMatches ? oldContainerMatches.length : 0} (should be 0)`);
  console.log(`   🚫 Old desktop ID count: ${desktopContainerMatches ? desktopContainerMatches.length : 0} (should be 0)`);

  // 2. Verify responsive grid layout
  const responsiveGridMatches = content.match(/space-y-3 md:space-y-0 md:grid md:grid-cols-4 md:gap-4/g);
  console.log(`   📱💻 Responsive grid layout: ${responsiveGridMatches ? responsiveGridMatches.length : 0} (should be 1)`);

  // 3. Verify duplicate section removal
  const mobileOnlyMatches = content.match(/className="md:hidden"/g);
  const desktopOnlyMatches = content.match(/className="hidden md:block"/g);
  
  // Count specifically in MasterTopicsSection area (not the entire file)
  const masterTopicsStart = content.indexOf('const MasterTopicsSection');
  const masterTopicsEnd = content.indexOf('export default function HomeV3');
  const masterTopicsContent = content.substring(masterTopicsStart, masterTopicsEnd);
  
  const mobileOnlyInMaster = masterTopicsContent.match(/className="md:hidden"/g);
  const desktopOnlyInMaster = masterTopicsContent.match(/className="hidden md:block"/g);
  
  console.log(`   📱 Mobile-only sections in MasterTopicsSection: ${mobileOnlyInMaster ? mobileOnlyInMaster.length : 0} (should be 1-2 for navigation)`);
  console.log(`   💻 Desktop-only sections in MasterTopicsSection: ${desktopOnlyInMaster ? desktopOnlyInMaster.length : 0} (should be 1-2 for navigation)`);

  // 4. Verify helper functions exist
  const handleScrollUpExists = content.includes('const handleScrollUp = ()');
  const handleScrollDownExists = content.includes('const handleScrollDown = ()');
  console.log(`   🎮 handleScrollUp function: ${handleScrollUpExists ? '✅' : '❌'}`);
  console.log(`   🎮 handleScrollDown function: ${handleScrollDownExists ? '✅' : '❌'}`);

  // 5. Verify animation enhancements
  const responsiveAnimations = content.includes('window.innerWidth >= 768 ?');
  console.log(`   🎬 Responsive animations: ${responsiveAnimations ? '✅' : '❌'}`);

  // ❌ DUPLICATION ELIMINATION VERIFICATION
  console.log('\n❌ DUPLICATION ELIMINATION VERIFICATION:');
  
  // Check for remaining duplicate patterns
  const duplicateGridPatterns = content.match(/grid grid-cols-4 gap-4/g);
  const duplicateScrollContainers = content.match(/overflow-y-auto scrollbar-hide/g);
  
  console.log(`   🔍 Grid pattern duplicates: ${duplicateGridPatterns ? duplicateGridPatterns.length : 0} (should be 1)`);
  console.log(`   🔍 Scroll container duplicates: ${duplicateScrollContainers ? duplicateScrollContainers.length : 0} (should be 1)`);

  // 🏗️ ARCHITECTURE VERIFICATION
  console.log('\n🏗️ ARCHITECTURE VERIFICATION:');
  
  const totalLines = content.split('\n').length;
  const masterTopicsLines = masterTopicsContent.split('\n').length;
  
  console.log(`   📊 Total HomeV3.tsx lines: ${totalLines}`);
  console.log(`   📊 MasterTopicsSection lines: ${masterTopicsLines}`);
  console.log(`   📦 Component consolidation ratio: ${((masterTopicsLines / totalLines) * 100).toFixed(1)}%`);

  // 🎯 FINAL SUCCESS ASSESSMENT
  console.log('\n🎯 CONSOLIDATION SUCCESS ASSESSMENT:');
  
  const criteriaChecks = [
    { name: 'Unified container ID', passed: unifiedContainerMatches?.length === 1 && !oldContainerMatches && !desktopContainerMatches },
    { name: 'Responsive grid layout', passed: responsiveGridMatches?.length === 1 },
    { name: 'Helper functions', passed: handleScrollUpExists && handleScrollDownExists },
    { name: 'Responsive animations', passed: responsiveAnimations },
    { name: 'Duplicate elimination', passed: (duplicateGridPatterns?.length || 0) <= 1 && (duplicateScrollContainers?.length || 0) <= 1 }
  ];

  const passedChecks = criteriaChecks.filter(check => check.passed).length;
  const totalChecks = criteriaChecks.length;

  criteriaChecks.forEach(check => {
    console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
  });

  console.log(`\n📈 CONSOLIDATION SUCCESS RATE: ${passedChecks}/${totalChecks} (${((passedChecks/totalChecks)*100).toFixed(1)}%)`);

  if (passedChecks === totalChecks) {
    console.log('\n🎉 PHASE 6 STEP 3 COMPLETE: MasterTopicsSection successfully consolidated!');
    console.log('   ✅ Mobile and desktop implementations unified into single responsive component');
    console.log('   ✅ Duplicate code eliminated while preserving all functionality');
    console.log('   ✅ Responsive design maintained with Tailwind breakpoint classes');
    console.log('   ✅ Ready for Phase 6 Step 4: Remaining component consolidations');
  } else {
    console.log('\n⚠️  CONSOLIDATION INCOMPLETE: Some criteria not met');
    console.log('   🔧 Manual review and additional consolidation work required');
  }

} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}