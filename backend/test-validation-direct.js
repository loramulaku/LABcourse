/**
 * Direct test of validation logic
 */

const IPDDoctorService = require('./services/IPDDoctorService');

async function testValidation() {
  console.log('\n🧪 Testing Validation Logic Directly\n');

  const service = new IPDDoctorService();

  // Test 1: Missing clinical_notes
  console.log('📋 TEST 1: Missing clinical_notes\n');
  try {
    await service.submitClinicalAssessment(27, 8, {
      // Missing clinical_notes
      requires_admission: false,
      therapy_prescribed: 'lora'
    });
    console.log('❌ FAILED: Should have thrown ValidationError');
  } catch (error) {
    console.log(`Error Type: ${error.constructor.name}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`Status Code: ${error.statusCode}`);
    
    if (error.constructor.name === 'ValidationError' && error.statusCode === 422) {
      console.log('✅✅✅ SUCCESS! ValidationError with 422 status code!');
      console.log('💡 The fix is working correctly!\n');
    } else if (error.constructor.name === 'Error') {
      console.log('❌ FAILED: Throwing generic Error instead of ValidationError');
      console.log('💡 Fix not applied correctly\n');
    } else {
      console.log(`ℹ️  Got ${error.constructor.name} (might be auth or other issue)\n`);
    }
  }

  // Test 2: Missing requires_admission
  console.log('📋 TEST 2: Missing requires_admission\n');
  try {
    await service.submitClinicalAssessment(27, 8, {
      clinical_notes: 'Test notes',
      // Missing requires_admission
      therapy_prescribed: 'lora'
    });
    console.log('❌ FAILED: Should have thrown ValidationError');
  } catch (error) {
    console.log(`Error Type: ${error.constructor.name}`);
    console.log(`Error Message: ${error.message}`);
    
    if (error.constructor.name === 'ValidationError') {
      console.log('✅ Validation working for requires_admission\n');
    }
  }

  // Test 3: No admission but missing therapy
  console.log('📋 TEST 3: No admission but missing therapy_prescribed\n');
  try {
    await service.submitClinicalAssessment(27, 8, {
      clinical_notes: 'Test notes',
      requires_admission: false,
      // Missing therapy_prescribed when admission=false
    });
    console.log('❌ FAILED: Should have thrown ValidationError');
  } catch (error) {
    console.log(`Error Type: ${error.constructor.name}`);
    console.log(`Error Message: ${error.message}`);
    
    if (error.constructor.name === 'ValidationError') {
      console.log('✅ Validation working for therapy requirement\n');
    }
  }

  console.log('🎯 ==================== VALIDATION TEST COMPLETE ====================\n');
  
  process.exit(0);
}

testValidation().catch(error => {
  console.error('Test Error:', error);
  process.exit(1);
});
