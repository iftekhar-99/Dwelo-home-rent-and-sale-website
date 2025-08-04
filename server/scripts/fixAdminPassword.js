import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import User from '../models/User.js';

async function fixAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin.updated@dwelo.com';
    const adminPassword = 'AdminPass123!';

    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    console.log('Found admin user:', user.email);

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    console.log('Password hashed successfully');

    // Use updateOne to bypass the pre-save hook
    const result = await User.updateOne(
      { _id: user._id },
      { 
        password: hashedPassword,
        email: 'admin@dwelo.com' // Reset email back to original
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Admin password updated successfully');
    } else {
      console.log('❌ Failed to update password');
      return;
    }

    // Verify the password was updated correctly
    const updatedUser = await User.findOne({ email: 'admin@dwelo.com' });
    const isPasswordValid = await bcrypt.compare(adminPassword, updatedUser.password);
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