const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log(`🗄️  Database: ${mongoose.connection.db.databaseName}`);
    
    // Create a test collection and document
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({
      message: 'Test connection successful',
      timestamp: new Date(),
      project: 'CareConnect'
    });
    
    console.log('✅ Test document created successfully!');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📊 Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Count documents in test collection
    const count = await testCollection.countDocuments();
    console.log(`📈 Test collection has ${count} documents`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testConnection(); 