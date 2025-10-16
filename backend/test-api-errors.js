const { sequelize, User, Doctor } = require('./models');
const doctorController = require('./controllers/doctorController');

async function testDoctorCreation() {
  console.log('\n=== Testing Doctor Creation ===\n');
  
  const mockReq = {
    body: {
      name: 'Dr. Test Doctor',
      email: `test${Date.now()}@test.com`,
      password: 'password123',
      specialization: 'General Medicine',
      degree: 'MD',
      experience_years: 5,
      fees: 100.00
    },
    file: null
  };

  const mockRes = {
    status: function(code) {
      this.statusCode = code;
      console.log(`Response Status: ${code}`);
      return this;
    },
    json: function(data) {
      console.log('Response Data:', JSON.stringify(data, null, 2));
      return this;
    }
  };

  try {
    await doctorController.createDoctor(mockReq, mockRes);
    console.log('\n✓ Doctor creation successful!');
  } catch (error) {
    console.error('\n✗ Error during doctor creation:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testNotificationQuery() {
  console.log('\n=== Testing Notification Query ===\n');
  
  try {
    const db = require('./db');
    
    // Test if notifications table exists
    const [tables] = await db.promise().query("SHOW TABLES LIKE 'notifications'");
    console.log('Notifications table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Test query
      const [notifications] = await db.promise().query(
        `SELECT n.*, u.name as sender_name 
         FROM notifications n 
         LEFT JOIN users u ON u.id = n.sent_by_user_id 
         WHERE n.user_id = ? 
         ORDER BY n.created_at DESC 
         LIMIT 5`,
        [1]  // Admin user
      );
      console.log('Sample notifications count:', notifications.length);
      if (notifications.length > 0) {
        console.log('Sample notification:', notifications[0]);
      }
    }
    
    console.log('\n✓ Notification query successful!');
  } catch (error) {
    console.error('\n✗ Error during notification query:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function runTests() {
  try {
    await testNotificationQuery();
    await testDoctorCreation();
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

runTests();

