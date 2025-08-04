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

async function debugAdmin() {
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

    console.log('Admin user found:');
    console.log('- Email:', user.email);
    console.log('- Password hash:', user.password);
    console.log('- Password length:', user.password.length);

    // Test with the current password
    const isCurrentValid = await bcrypt.compare(adminPassword, user.password);
    console.log('Current password valid:', isCurrentValid);

    // Create a new hash
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(adminPassword, salt);
    console.log('New hash:', newHash);
    console.log('New hash length:', newHash.length);

    // Test the new hash
    const isNewValid = await bcrypt.compare(adminPassword, newHash);
    console.log('New hash valid:', isNewValid);

    // Update the user
    user.password = newHash;
    await user.save({ validateBeforeSave: false });
    console.log('User saved');

    // Read the user again
    const updatedUser = await User.findOne({ email: adminEmail });
    console.log('Updated password hash:', updatedUser.password);
    console.log('Updated password length:', updatedUser.password.length);

    // Test the updated password
    const isUpdatedValid = await bcrypt.compare(adminPassword, updatedUser.password);
    console.log('Updated password valid:', isUpdatedValid);

  } catch (error) {
    console.error('Error debugging admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugAdmin(); 