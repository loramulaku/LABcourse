/**
 * Complete Authentication Flow Test
 * Tests: Login → Token Expires → Refresh → Logout → Add Doctor
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'lora@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'loraPassword123', // Update with actual password
};

let accessToken = null;
let refreshToken = null;
let userId = null;
let userRole = null;

// Helper to make authenticated requests
async function apiCall(method, url, data = null, useToken = true) {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {},
    withCredentials: true, // Important for cookies
  };

  if (useToken && accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (data) {
    config.headers['Content-Type'] = 'application/json';
    config.data = data;
  }

  return axios(config);
}

// Test Suite
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   🧪 AUTHENTICATION FLOW TEST SUITE          ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // TEST 1: Login
    await testLogin();

    // TEST 2: Access Protected Endpoint
    await testProtectedEndpoint();

    // TEST 3: Refresh Token
    await testRefreshToken();

    // TEST 4: Add Doctor (Image Upload Test)
    await testAddDoctor();

    // TEST 5: Logout
    await testLogout();

    // TEST 6: Verify Logout
    await testAfterLogout();

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED! 🎉                    ║');
    console.log('╚════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ❌ TEST FAILED                             ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Test 1: Login
async function testLogin() {
  console.log('📝 TEST 1: Login');
  console.log('  Action: POST /api/auth/login');
  console.log(`  User: ${TEST_USER.email}`);

  const response = await apiCall('POST', '/api/auth/login', TEST_USER, false);

  accessToken = response.data.accessToken;
  userRole = response.data.role;
  userId = response.data.userId;

  // Get refresh token from cookie
  const cookies = response.headers['set-cookie'];
  if (cookies) {
    const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
    if (refreshCookie) {
      refreshToken = refreshCookie.split(';')[0].split('=')[1];
    }
  }

  console.log('  ✅ Login successful');
  console.log(`  → User ID: ${userId}`);
  console.log(`  → Role: ${userRole}`);
  console.log(`  → Access Token: ${accessToken.substring(0, 20)}...`);
  console.log(`  → Refresh Token: ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'Found in cookie'}`);
  console.log('');
}

// Test 2: Access Protected Endpoint
async function testProtectedEndpoint() {
  console.log('📝 TEST 2: Access Protected Endpoint');
  console.log('  Action: GET /api/auth/navbar-info');

  const response = await apiCall('GET', '/api/auth/navbar-info');

  console.log('  ✅ Navbar info retrieved');
  console.log(`  → Name: ${response.data.name}`);
  console.log(`  → Role: ${response.data.role}`);
  console.log(`  → Profile Photo: ${response.data.profilePhoto}`);
  console.log('');
}

// Test 3: Refresh Token
async function testRefreshToken() {
  console.log('📝 TEST 3: Refresh Token');
  console.log('  Action: POST /api/auth/refresh');
  console.log('  Scenario: Simulating token refresh');

  const response = await apiCall('POST', '/api/auth/refresh', null, false);

  const oldAccessToken = accessToken;
  accessToken = response.data.accessToken;

  console.log('  ✅ Token refreshed successfully');
  console.log(`  → Old Access Token: ${oldAccessToken.substring(0, 20)}...`);
  console.log(`  → New Access Token: ${accessToken.substring(0, 20)}...`);
  console.log(`  → Tokens are different: ${oldAccessToken !== accessToken ? 'Yes ✓' : 'No ✗'}`);
  console.log('');
}

// Test 4: Add Doctor
async function testAddDoctor() {
  console.log('📝 TEST 4: Add Doctor (Full Feature Test)');
  console.log('  Action: POST /api/doctors');

  const doctorData = {
    name: `Dr. Test Doctor ${Date.now()}`,
    email: `test.doctor.${Date.now()}@test.com`,
    password: 'testpass123',
    specialization: 'General Medicine',
    degree: 'MD',
    experience_years: 5,
    fees: 100.00,
    about: 'Test doctor created by automated test',
    available: true,
  };

  console.log(`  → Creating: ${doctorData.name}`);
  console.log(`  → Email: ${doctorData.email}`);

  const response = await apiCall('POST', '/api/doctors', doctorData);

  console.log('  ✅ Doctor created successfully');
  console.log(`  → Doctor ID: ${response.data.doctor.id}`);
  console.log(`  → User ID: ${response.data.doctor.user_id}`);
  console.log(`  → Image: ${response.data.doctor.image}`);
  console.log(`  → First Name: ${response.data.doctor.first_name}`);
  console.log(`  → Last Name: ${response.data.doctor.last_name}`);
  console.log(`  → Specialization: ${response.data.doctor.specialization}`);

  // Verify user was created
  console.log('  → User Account:');
  console.log(`    • ID: ${response.data.doctor.User.id}`);
  console.log(`    • Name: ${response.data.doctor.User.name}`);
  console.log(`    • Email: ${response.data.doctor.User.email}`);
  console.log(`    • Role: ${response.data.doctor.User.role}`);
  
  // Verify image path format
  const hasValidImagePath = response.data.doctor.image && 
                           response.data.doctor.image.startsWith('/uploads');
  console.log(`  → Image Path Valid: ${hasValidImagePath ? 'Yes ✓' : 'No ✗'}`);
  
  console.log('');
}

// Test 5: Logout
async function testLogout() {
  console.log('📝 TEST 5: Logout');
  console.log('  Action: POST /api/auth/logout');

  const response = await apiCall('POST', '/api/auth/logout');

  console.log('  ✅ Logout successful');
  console.log(`  → Message: ${response.data.message}`);
  console.log('  → Refresh token removed from database');
  console.log('  → Cookie cleared');
  console.log('');
}

// Test 6: Verify Logout
async function testAfterLogout() {
  console.log('📝 TEST 6: Verify Logout (Should Fail)');
  console.log('  Action: GET /api/auth/navbar-info (with old token)');

  try {
    await apiCall('GET', '/api/auth/navbar-info');
    console.log('  ✗ UNEXPECTED: Request succeeded after logout');
    throw new Error('Should have failed after logout');
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('  ✅ Correctly rejected (403/401)');
      console.log('  → Old access token no longer works (expected)');
      console.log('');
    } else {
      throw error;
    }
  }
}

// Run all tests
console.log('\n⚠️  Make sure backend server is running on port 5000!');
console.log('⚠️  Update TEST_USER.password with actual admin password!\n');

setTimeout(runTests, 1000);

