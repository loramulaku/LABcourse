/**
 * Test Clinical Assessment Submission for Appointment 27
 * Simulates the exact API call the frontend makes
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';

// Test with a doctor's token - you'll need to login first
// For now, we'll test the endpoint structure and validation

async function testAssessmentSubmission() {
  console.log('\n🧪 ==================== TESTING CLINICAL ASSESSMENT SUBMISSION ====================\n');

  // Test 1: Missing Clinical Notes (should return 422)
  console.log('📋 TEST 1: Submit WITHOUT clinical_notes (should fail with 422)\n');
  try {
    const response = await fetch(`${API_URL}/api/doctor/appointment/27/clinical-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail auth, but we're testing validation first
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        // Missing clinical_notes intentionally
        requires_admission: false,
        therapy_prescribed: 'lora'
      })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Got 401 Unauthorized (expected - no valid token)');
      console.log('💡 This is correct - authentication is working\n');
    } else if (response.status === 422) {
      console.log('✅ Got 422 Validation Error (validation working!)');
      console.log('💡 Message:', data.error?.message || data.message);
    } else if (response.status === 500) {
      console.log('❌ Got 500 Internal Server Error - VALIDATION NOT WORKING');
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Check endpoint exists
  console.log('📋 TEST 2: Check if endpoint exists\n');
  try {
    const response = await fetch(`${API_URL}/api/doctor/appointment/27/clinical-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists and requires authentication');
    } else if (response.status === 404) {
      console.log('❌ Endpoint NOT FOUND - routing issue');
    } else {
      console.log(`ℹ️  Got status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('⚠️  Backend might not be running on port 5000');
  }

  console.log('\n---\n');

  // Test 3: Verify doctor can authenticate
  console.log('📋 TEST 3: Get doctor login token\n');
  try {
    console.log('Attempting to login as Dr. Arben Hoxha...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'arben.hoxha@labcourse.com',
        password: 'password123' // Typical test password
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.access_token || loginData.token || loginData.accessToken;
      
      if (token) {
        console.log('✅ Login successful! Got token:', token.substring(0, 20) + '...');
        
        // Now test with valid token
        console.log('\n📋 TEST 4: Submit WITH valid token but WITHOUT clinical_notes\n');
        
        const assessmentResponse = await fetch(`${API_URL}/api/doctor/appointment/27/clinical-assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            requires_admission: false,
            therapy_prescribed: 'lora'
          })
        });

        const assessmentData = await assessmentResponse.json();
        
        console.log(`Status: ${assessmentResponse.status}`);
        console.log(`Response:`, JSON.stringify(assessmentData, null, 2));
        
        if (assessmentResponse.status === 422) {
          console.log('\n✅✅✅ SUCCESS! Validation working correctly!');
          console.log('💡 Error message:', assessmentData.error?.message || assessmentData.message);
          console.log('💡 The fix is working - returning 422 for missing fields!\n');
        } else if (assessmentResponse.status === 500) {
          console.log('\n❌❌❌ FAILED! Still getting 500 error');
          console.log('💡 The validation fix may not have been applied\n');
        } else if (assessmentResponse.status === 200) {
          console.log('\n⚠️  Got 200 OK - validation may not be strict enough\n');
        }

        // Test with complete data
        console.log('📋 TEST 5: Submit WITH all required fields\n');
        
        const completeResponse = await fetch(`${API_URL}/api/doctor/appointment/27/clinical-assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            clinical_notes: 'TEST: Patient presented for routine follow-up. Physical examination shows vital signs within normal limits. Patient is responding well to current treatment.',
            requires_admission: false,
            therapy_prescribed: 'Continue current medications. Vitamin D 1000 IU daily. Follow-up in 3 months.',
            diagnosis: null,
            chief_complaint: 'Routine follow-up',
            treatment_plan: 'Continue current treatment plan',
            follow_up_instructions: 'Return in 3 months for follow-up'
          })
        });

        const completeData = await completeResponse.json();
        
        console.log(`Status: ${completeResponse.status}`);
        console.log(`Response:`, JSON.stringify(completeData, null, 2));
        
        if (completeResponse.status === 200) {
          console.log('\n✅✅✅ SUCCESS! Assessment submitted successfully!');
          console.log('💡 Full flow is working end-to-end!\n');
        } else {
          console.log('\n⚠️  Got status:', completeResponse.status);
          console.log('💡 Check the error message above for details\n');
        }

      } else {
        console.log('⚠️  Login successful but no token found in response');
      }
    } else {
      const errorData = await loginResponse.json();
      console.log('⚠️  Login failed:', errorData.message || errorData.error);
      console.log('💡 Try logging in through the UI first to verify credentials');
    }
  } catch (error) {
    console.error('❌ Login Error:', error.message);
  }

  console.log('\n🎯 ==================== TEST SUMMARY ====================\n');
  console.log('✅ If you saw "422 Validation Error" for missing fields: FIX WORKING');
  console.log('✅ If you saw "200 OK" for complete data: SUBMISSION WORKING');
  console.log('❌ If you saw "500 Internal Server Error": FIX NOT APPLIED YET');
  console.log('\n💡 To test in browser:');
  console.log('   1. Login as doctor: arben.hoxha@labcourse.com');
  console.log('   2. Go to: http://localhost:5173/doctor/appointment/27');
  console.log('   3. Click "Clinical Assessment"');
  console.log('   4. Scroll UP to fill "Clinical Notes" field');
  console.log('   5. Fill therapy field');
  console.log('   6. Submit\n');
}

testAssessmentSubmission().catch(console.error);
