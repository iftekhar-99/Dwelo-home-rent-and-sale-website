import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, 'server', '.env') });

// Import User model
import User from './server/models/User.js';

async function resetLockouts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('Connected to MongoDB');

    // Reset all user lockouts
    const result = await User.updateMany(
      {},
      {
        $set: {
          loginAttempts: 0,
          lockUntil: null
        }
      }
    );

    console.log(`✅ Reset lockouts for ${result.modifiedCount} users`);
    
    // Check for any locked users
    const lockedUsers = await User.find({
      $or: [
        { loginAttempts: { $gt: 0 } },
        { lockUntil: { $exists: true, $ne: null } }
      ]
    });

    if (lockedUsers.length > 0) {
      console.log('⚠️ Found users with lockout data:');
      lockedUsers.forEach(user => {
        console.log(`- ${user.email}: attempts=${user.loginAttempts}, locked until=${user.lockUntil}`);
      });
    } else {
      console.log('✅ No locked users found');
    }

    // List all users
    const allUsers = await User.find({}).select('email role loginAttempts lockUntil');
    console.log('\n📋 All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}): attempts=${user.loginAttempts}, locked=${!!user.lockUntil}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetLockouts(); 