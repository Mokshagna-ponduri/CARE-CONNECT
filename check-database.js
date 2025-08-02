const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    // Direct connection string (since .env has formatting issues)
    const MONGODB_URI = 'mongodb+srv://mokshagna:ngsm_0812@cluster0.7ijq9o3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📊 Database Collections:');
    if (collections.length === 0) {
      console.log('   No collections found. Database is empty.');
    } else {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    }
    
    // Check each collection for data
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   📈 ${collection.name}: ${count} documents`);
    }
    
    // Show database name
    console.log(`\n🗄️  Database Name: ${mongoose.connection.db.databaseName}`);
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase(); 