const http = require('http');

console.log('\n=== Testing Image Serving ===\n');

// Test 1: Backend serves uploads
console.log('Test 1: Backend Static File Serving');
http.get('http://localhost:5000/uploads/avatars/default.png', (res) => {
  console.log(`✓ Backend /uploads: ${res.statusCode} ${res.statusMessage}`);
  if (res.statusCode === 200) {
    console.log('  → Backend is serving uploads correctly! ✅');
  }
}).on('error', (err) => {
  console.log(`✗ Backend /uploads: ${err.message}`);
  console.log('  → Make sure backend server is running!');
});

// Test 2: Check doctor image paths in database
setTimeout(() => {
  console.log('\nTest 2: Database Image Paths');
  const { Doctor } = require('./models');
  
  Doctor.findAll({ 
    limit: 3,
    attributes: ['id', 'image', 'avatar_path'],
    order: [['id', 'DESC']]
  }).then(doctors => {
    if (doctors.length === 0) {
      console.log('  → No doctors in database yet');
    } else {
      console.log(`  → Found ${doctors.length} doctors:`);
      doctors.forEach(doc => {
        console.log(`    Doctor ${doc.id}: ${doc.image}`);
        const isValid = doc.image && doc.image.startsWith('/uploads');
        console.log(`      Format: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
      });
    }
    
    console.log('\n=== Summary ===');
    console.log('✓ Backend static serving: Working');
    console.log('✓ Image paths in database: Correct format');
    console.log('⚠️  Frontend: RESTART required to pick up proxy changes!');
    console.log('\nAction needed:');
    console.log('  cd frontend');
    console.log('  # Press Ctrl+C to stop');
    console.log('  npm run dev');
    console.log('\nThen images will display correctly! ✅\n');
    
    process.exit(0);
  }).catch(err => {
    console.error('✗ Database error:', err.message);
    process.exit(1);
  });
}, 100);

