const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 Collections found:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   📈 ${collection.name}: ${count} documents`);
    }
    
    console.log(`\n🗄️  Database: ${db.databaseName}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

checkDB(); 