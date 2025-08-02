const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Database connection string
const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Help Request Schema
const helpRequestSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  location: String,
  status: { type: String, default: 'open' },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  helper: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Chat Schema
const chatSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);
const Chat = mongoose.model('Chat', chatSchema);

async function createSampleData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Clear existing data
    await User.deleteMany({});
    await HelpRequest.deleteMany({});
    await Chat.deleteMany({});
    console.log('🧹 Cleared existing data');
    
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.create([
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'user'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: hashedPassword,
        role: 'user'
      },
      {
        name: 'Mike Wilson',
        email: 'mike@example.com',
        password: hashedPassword,
        role: 'user'
      },
      {
        name: 'Emily Davis',
        email: 'emily@example.com',
        password: hashedPassword,
        role: 'user'
      },
      {
        name: 'David Brown',
        email: 'david@example.com',
        password: hashedPassword,
        role: 'user'
      }
    ]);
    
    console.log(`👥 Created ${users.length} users`);
    
    // Create sample help requests
    const helpRequests = await HelpRequest.create([
      {
        title: 'Need help with grocery shopping',
        description: 'I need assistance with grocery shopping due to mobility issues. Looking for someone to help me get essential items.',
        category: 'Shopping',
        location: 'Downtown Area',
        status: 'open',
        requester: users[0]._id
      },
      {
        title: 'Help with computer setup',
        description: 'I recently bought a new laptop and need help setting it up and installing basic software.',
        category: 'Technology',
        location: 'Westside',
        status: 'open',
        requester: users[1]._id
      },
      {
        title: 'Pet sitting needed',
        description: 'Looking for someone to watch my dog for a few hours while I attend an important meeting.',
        category: 'Pet Care',
        location: 'North District',
        status: 'in-progress',
        requester: users[2]._id,
        helper: users[3]._id
      },
      {
        title: 'Garden maintenance help',
        description: 'Need help with basic garden maintenance - weeding, watering, and light pruning.',
        category: 'Home & Garden',
        location: 'Eastside',
        status: 'completed',
        requester: users[3]._id,
        helper: users[4]._id
      },
      {
        title: 'Moving assistance',
        description: 'Need help moving furniture and boxes from my apartment to a new location.',
        category: 'Moving',
        location: 'Central Area',
        status: 'open',
        requester: users[4]._id
      }
    ]);
    
    console.log(`📋 Created ${helpRequests.length} help requests`);
    
    // Create sample chats
    const chats = await Chat.create([
      {
        requestId: helpRequests[2]._id,
        sender: users[2]._id,
        receiver: users[3]._id,
        message: 'Hi! I can help you with pet sitting. What time do you need me?'
      },
      {
        requestId: helpRequests[2]._id,
        sender: users[3]._id,
        receiver: users[2]._id,
        message: 'That would be great! I need help from 2 PM to 6 PM today.'
      },
      {
        requestId: helpRequests[2]._id,
        sender: users[2]._id,
        receiver: users[3]._id,
        message: 'Perfect! I can do that. What\'s your address?'
      },
      {
        requestId: helpRequests[3]._id,
        sender: users[3]._id,
        receiver: users[4]._id,
        message: 'I can help with your garden maintenance. What tools do you have?'
      },
      {
        requestId: helpRequests[3]._id,
        sender: users[4]._id,
        receiver: users[3]._id,
        message: 'I have basic gardening tools. When can you come over?'
      },
      {
        requestId: helpRequests[3]._id,
        sender: users[3]._id,
        receiver: users[4]._id,
        message: 'I can come tomorrow at 10 AM. Does that work for you?'
      }
    ]);
    
    console.log(`💬 Created ${chats.length} chat messages`);
    
    console.log('\n🎉 Sample data created successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Help Requests: ${helpRequests.length}`);
    console.log(`   - Chat Messages: ${chats.length}`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createSampleData(); 