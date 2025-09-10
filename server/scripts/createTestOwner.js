import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Import models
import User from '../models/User.js';
import Owner from '../models/Owner.js';

async function createTestOwner() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('Connected to MongoDB');

    const ownerEmail = 'owner@dwelo.com';
    const ownerPassword = 'OwnerPass123!';
    const ownerName = 'Test Owner';

    // Check if owner already exists
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      console.log('Owner user already exists:', ownerEmail);
      console.log('Deleting existing user to recreate with correct password...');
      
      // Delete existing owner record
      await Owner.deleteOne({ userId: existingUser._id });
      // Delete existing user
      await User.deleteOne({ _id: existingUser._id });
      console.log('Existing records deleted');
    }
    
    // Create new owner user
     console.log('Creating new owner user...');
     
     // Create user with plain password (will be hashed by pre-save hook)
     const user = new User({
       name: ownerName,
       email: ownerEmail,
       password: ownerPassword,
       role: 'owner',
       isActive: true,
       isEmailVerified: true
     });
     
     // Save the user (password will be automatically hashed)
     await user.save();
    console.log('User created successfully');
    
    // Create owner record
    const owner = new Owner({
      userId: user._id,
      isActive: true
    });
    
    await owner.save();
    console.log('Owner record created successfully');
    
    console.log('\nTest Owner Created Successfully!');
    console.log('Email:', ownerEmail);
    console.log('Password:', ownerPassword);
    console.log('\nYou can now login at: http://localhost:5174/owner/login');

  } catch (error) {
    console.error('Error creating owner:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestOwner();