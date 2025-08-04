import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import User from '../models/User.js';

async function debugAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@dwelo.com';
    const adminPassword = 'AdminPass123!';

    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('Admin user found:');
    console.log('- Email:', user.email);
    console.log('- Password hash:', user.password);
    console.log('- Password length:', user.password.length);

    const isCurrentValid = await bcrypt.compare(adminPassword, user.password);
    console.log('Current password valid:', isCurrentValid);

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(adminPassword, salt);
    console.log('New hash:', newHash);
    console.log('New hash length:', newHash.length);

    const isNewValid = await bcrypt.compare(adminPassword, newHash);
    console.log('New hash valid:', isNewValid);

    user.password = newHash;
    await user.save({ validateBeforeSave: false });
    console.log('User saved');

    const updatedUser = await User.findOne({ email: adminEmail });
    console.log('Updated password hash:', updatedUser.password);
    console.log('Updated password length:', updatedUser.password.length);

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