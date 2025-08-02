const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkCurrentData() {
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
    
    console.log(`\n📊 Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check each collection for data
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   📈 ${collection.name}: ${count} documents`);
      
      // Show sample documents for users collection
      if (collection.name === 'users') {
        const users = await mongoose.connection.db.collection(collection.name).find({}).limit(5).toArray();
        console.log(`   👥 Sample users:`);
        users.forEach(user => {
          console.log(`      - ${user.name} (${user.email})`);
        });
      }
    }
    
    console.log('\n🎉 Your database is working perfectly!');
    console.log('💡 Collections are created automatically when you:');
    console.log('   - Register users (creates "users" collection)');
    console.log('   - Create help requests (creates "helprequests" collection)');
    console.log('   - Start chatting (creates "chats" collection)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkCurrentData(); 