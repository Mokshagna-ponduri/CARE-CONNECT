const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Import User model
const User = require('./models/User');

async function createTestUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Create a test user with profile data
    const testUser = new User({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'helper',
      profile: {
        avatar: 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=JD',
        bio: 'I love helping people in my community. I specialize in computer setup, tutoring, and general assistance.',
        skills: ['computer setup', 'tutoring', 'driving', 'cooking'],
        interests: ['technology', 'education', 'community service']
      },
      rating: {
        average: 4.8,
        count: 12
      },
      location: {
        type: 'Point',
        coordinates: [40.7128, -74.0060],
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    });

    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: john.doe@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 Name: John Doe');
    console.log('📱 Phone: +1234567890');
    console.log('🎯 Skills: computer setup, tutoring, driving, cooking');
    console.log('⭐ Rating: 4.8 (12 reviews)');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestUser(); 