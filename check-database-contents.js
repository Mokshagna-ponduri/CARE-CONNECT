const mongoose = require('mongoose');

// Database connection string
const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Import existing models
const User = require('./models/User');
const HelpRequest = require('./models/HelpRequest');
const Chat = require('./models/Chat');

async function checkDatabaseContents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`🗄️  Database: ${mongoose.connection.db.databaseName}`);
    
    // Check Users
    const users = await User.find({}).select('-password');
    console.log(`\n👥 Users (${users.length}):`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check Help Requests
    const helpRequests = await HelpRequest.find({}).populate('requester', 'name email');
    console.log(`\n📋 Help Requests (${helpRequests.length}):`);
    helpRequests.forEach(request => {
      console.log(`   - ${request.title} (${request.category}) - Status: ${request.status}`);
      console.log(`     Requester: ${request.requester ? request.requester.name : 'Unknown'}`);
    });
    
    // Check Chats
    const chats = await Chat.find({}).populate('sender', 'name').populate('receiver', 'name');
    console.log(`\n💬 Chat Messages (${chats.length}):`);
    chats.forEach(chat => {
      console.log(`   - ${chat.sender ? chat.sender.name : 'Unknown'} → ${chat.receiver ? chat.receiver.name : 'Unknown'}: ${chat.message.substring(0, 50)}...`);
    });
    
    // Summary
    console.log('\n📊 Database Summary:');
    console.log(`   - Total Users: ${users.length}`);
    console.log(`   - Total Help Requests: ${helpRequests.length}`);
    console.log(`   - Total Chat Messages: ${chats.length}`);
    
    if (users.length === 0) {
      console.log('\n💡 To add data:');
      console.log('   1. Go to http://localhost:3001');
      console.log('   2. Register new users');
      console.log('   3. Create help requests');
      console.log('   4. Start chatting');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabaseContents(); 