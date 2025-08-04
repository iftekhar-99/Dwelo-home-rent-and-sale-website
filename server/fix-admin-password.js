import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import models
import User from './models/User.js';

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@dwelo.com';
    const adminPassword = 'AdminPass123!';

    // Find admin user
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('Found admin user:', user.email);

    // Hash the password properly
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    console.log('Password hashed successfully');

    // Update the user with the correct hashed password
    user.password = hashedPassword;
    await user.save({ validateBeforeSave: false });
    
    console.log('✅ Admin password updated successfully');

    // Verify the password works
    const isPasswordValid = await bcrypt.compare(adminPassword, user.password);
    console.log('Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    if (isPasswordValid) {
      console.log('\n🎉 Admin password is now working correctly!');
      console.log('You can now login with:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    }

  } catch (error) {
    console.error('Error fixing admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixAdminPassword(); 