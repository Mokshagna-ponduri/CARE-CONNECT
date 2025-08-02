const mongoose = require('mongoose');

// Database connection string
const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function databaseManager() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`🗄️  Database: ${mongoose.connection.db.databaseName}`);
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📊 Current Collections:');
    if (collections.length === 0) {
      console.log('   No collections found. Database is empty.');
      console.log('   Collections will be created when you:');
      console.log('   - Register a user (creates "users" collection)');
      console.log('   - Create a help request (creates "helprequests" collection)');
      console.log('   - Start a chat (creates "chats" collection)');
    } else {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
      
      // Show document counts
      console.log('\n📈 Document Counts:');
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`   ${collection.name}: ${count} documents`);
      }
    }
    
    console.log('\n🚀 Your database is ready!');
    console.log('   To add data:');
    console.log('   1. Go to http://localhost:3001');
    console.log('   2. Register a new user account');
    console.log('   3. Create help requests');
    console.log('   4. Start chatting');
    
    console.log('\n🌐 To view your database:');
    console.log('   - Web: https://cloud.mongodb.com');
    console.log('   - Desktop: Download MongoDB Compass');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

databaseManager(); 