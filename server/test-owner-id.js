import mongoose from 'mongoose';
import Owner from './models/Owner.js';
import User from './models/User.js';
import PropertyRequest from './models/PropertyRequest.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const testOwnerIds = async () => {
  try {
    console.log('Testing Owner and User IDs...');
    
    // Get all owners
    const owners = await Owner.find({}).populate('userId');
    console.log(`Found ${owners.length} owners`);
    
    for (const owner of owners) {
      console.log(`\nOwner ID: ${owner._id}`);
      console.log(`Owner User ID: ${owner.userId}`);
      console.log(`Owner User: ${owner.userId?.email || 'No user'}`);
      
      // Check if this owner has any property requests
      const requests = await PropertyRequest.find({ owner: owner.userId });
      console.log(`Property requests for this owner: ${requests.length}`);
      
      for (const request of requests) {
        console.log(`  Request ID: ${request._id}`);
        console.log(`  Request Owner: ${request.owner}`);
        console.log(`  Match: ${request.owner.toString() === owner.userId.toString()}`);
      }
    }
    
    // Also check all property requests
    console.log('\nAll PropertyRequest records:');
    const allRequests = await PropertyRequest.find({});
    for (const request of allRequests) {
      console.log(`Request ${request._id}: owner = ${request.owner}`);
    }
    
  } catch (error) {
    console.error('Error testing owner IDs:', error);
  }
};

const main = async () => {
  await connectDB();
  await testOwnerIds();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
};

main();
