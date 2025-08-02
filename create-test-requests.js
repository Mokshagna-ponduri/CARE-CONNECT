const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Import models
const User = require('./models/User');
const HelpRequest = require('./models/HelpRequest');

async function createTestRequests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Get existing users
    const users = await User.find({}).limit(3);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      return;
    }
    
    console.log(`👥 Found ${users.length} users`);
    
    // Create test help requests
    const testRequests = [
      {
        title: 'Need help with grocery shopping',
        description: 'I need assistance with grocery shopping due to mobility issues. Looking for someone to help me get essential items.',
        category: 'food',
        urgency: 'medium',
        requester: users[0]._id,
        location: {
          type: 'Point',
          coordinates: [40.7128, -74.0060],
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        }
      },
      {
        title: 'Help with computer setup',
        description: 'I recently bought a new laptop and need help setting it up and installing basic software.',
        category: 'education',
        urgency: 'low',
        requester: users[1]._id,
        location: {
          type: 'Point',
          coordinates: [40.7589, -73.9851],
          address: '456 Broadway',
          city: 'New York',
          state: 'NY',
          zipCode: '10013'
        }
      },
      {
        title: 'Pet sitting needed',
        description: 'Looking for someone to watch my dog for a few hours while I attend an important meeting.',
        category: 'household',
        urgency: 'high',
        requester: users[2]._id,
        location: {
          type: 'Point',
          coordinates: [40.7505, -73.9934],
          address: '789 5th Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10022'
        }
      },
      {
        title: 'Garden maintenance help',
        description: 'Need help with basic garden maintenance - weeding, watering, and light pruning.',
        category: 'household',
        urgency: 'low',
        requester: users[0]._id,
        location: {
          type: 'Point',
          coordinates: [40.7614, -73.9776],
          address: '321 Park Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10022'
        }
      },
      {
        title: 'Moving assistance',
        description: 'Need help moving furniture and boxes from my apartment to a new location.',
        category: 'transportation',
        urgency: 'medium',
        requester: users[1]._id,
        location: {
          type: 'Point',
          coordinates: [40.7484, -73.9857],
          address: '654 Madison Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10022'
        }
      }
    ];
    
    // Clear existing help requests
    await HelpRequest.deleteMany({});
    console.log('🧹 Cleared existing help requests');
    
    // Create help requests
    const helpRequests = await HelpRequest.create(testRequests);
    
    console.log(`📋 Created ${helpRequests.length} test help requests`);
    
    console.log('\n📊 Test Requests Created:');
    helpRequests.forEach((request, index) => {
      console.log(`   ${index + 1}. ${request.title} (${request.category}) - ${request.urgency} urgency`);
    });
    
    console.log('\n🎉 Test data created successfully!');
    console.log('💡 You can now test:');
    console.log('   - Category filtering');
    console.log('   - Accept request functionality');
    console.log('   - Request details modal');
    
  } catch (error) {
    console.error('❌ Error creating test requests:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestRequests(); 